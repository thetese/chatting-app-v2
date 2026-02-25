import fp from 'fastify-plugin';
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import { env } from '../config/env';
import { prisma } from '../lib/prisma';
import { appendRealtimeEvent, getEventsAfterSequence, getLatestSequence, RealtimeEnvelope } from '../services/realtimeEvents';

declare module 'fastify' {
  interface FastifyInstance {
    io: Server;
    publishRealtimeEvent: <T extends Record<string, unknown>>(orgId: string, type: string, payload: T, rooms?: string[]) => RealtimeEnvelope<T>;
  }
}

type TypingWindow = { count: number; windowStartMs: number };
const typingRateBySocket = new Map<string, TypingWindow>();
const presenceByOrg = new Map<string, Map<string, { status: string; lastSeenAt: string }>>();

const TYPING_LIMIT_PER_10S = 20;

function allowTypingEvent(socketId: string) {
  const now = Date.now();
  const current = typingRateBySocket.get(socketId);
  if (!current || now - current.windowStartMs >= 10_000) {
    typingRateBySocket.set(socketId, { count: 1, windowStartMs: now });
    return true;
  }

  if (current.count >= TYPING_LIMIT_PER_10S) {
    return false;
  }

  current.count += 1;
  typingRateBySocket.set(socketId, current);
  return true;
}

export default fp(async function realtimePlugin(app) {
  const io = new Server(app.server, { cors: { origin: true, credentials: true } });

  if (env.REDIS_URL) {
    const pubClient = new Redis(env.REDIS_URL);
    const subClient = pubClient.duplicate();
    io.adapter(createAdapter(pubClient, subClient));
  }

  app.decorate('publishRealtimeEvent', (orgId, type, payload, rooms = [`org:${orgId}`]) => {
    const envelope = appendRealtimeEvent(orgId, type, payload);
    for (const room of rooms) {
      io.to(room).emit('event', envelope);
    }
    return envelope;
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      const payload = await app.jwt.verify<{ sub: string; orgId: string }>(token);
      socket.data.userId = payload.sub;
      socket.data.orgId = payload.orgId;
      return next();
    } catch {
      return next(new Error('UNAUTHORIZED'));
    }
  });

  io.on('connection', (socket) => {
    const orgId = socket.data.orgId as string;
    const userId = socket.data.userId as string;
    socket.join(`org:${orgId}`);

    const orgPresence = presenceByOrg.get(orgId) ?? new Map<string, { status: string; lastSeenAt: string }>();
    orgPresence.set(userId, { status: 'online', lastSeenAt: new Date().toISOString() });
    presenceByOrg.set(orgId, orgPresence);

    app.publishRealtimeEvent(orgId, 'presence.updated', { userId, status: 'online' });

    socket.emit('realtime.hello', {
      latestSeq: getLatestSequence(orgId),
      reconnectHint: 'send realtime.resync with lastSeq to recover missed events'
    });

    socket.on('subscribe.conversation', async (conversationId: string, ack?: (data: Record<string, unknown>) => void) => {
      const member = await prisma.conversationMember.findFirst({ where: { orgId, conversationId, userId } });
      if (!member) {
        ack?.({ ok: false, error: 'NOT_IN_CONVERSATION' });
        return;
      }

      socket.join(`conversation:${conversationId}`);
      ack?.({ ok: true, conversationId });
    });

    socket.on('resubscribe.conversations', async (conversationIds: string[], ack?: (data: Record<string, unknown>) => void) => {
      const uniqueIds = [...new Set(conversationIds)].slice(0, 200);
      const memberships = await prisma.conversationMember.findMany({
        where: { orgId, userId, conversationId: { in: uniqueIds } },
        select: { conversationId: true }
      });

      const allowedIds = memberships.map((m) => m.conversationId);
      for (const id of allowedIds) {
        socket.join(`conversation:${id}`);
      }

      ack?.({ ok: true, subscribed: allowedIds });
    });

    socket.on('realtime.resync', (lastSeq: number, ack?: (data: Record<string, unknown>) => void) => {
      const safeLastSeq = Number.isFinite(lastSeq) ? Math.max(0, Math.floor(lastSeq)) : 0;
      const events = getEventsAfterSequence(orgId, safeLastSeq, 500);
      ack?.({ ok: true, latestSeq: getLatestSequence(orgId), events });
    });

    socket.on('presence.update', (status: string) => {
      const sanitized = ['online', 'away', 'dnd', 'offline'].includes(status) ? status : 'online';
      const orgPresenceMap = presenceByOrg.get(orgId) ?? new Map<string, { status: string; lastSeenAt: string }>();
      orgPresenceMap.set(userId, { status: sanitized, lastSeenAt: new Date().toISOString() });
      presenceByOrg.set(orgId, orgPresenceMap);
      app.publishRealtimeEvent(orgId, 'presence.updated', { userId, status: sanitized });
    });

    socket.on('typing.start', async (conversationId: string, ack?: (data: Record<string, unknown>) => void) => {
      if (!allowTypingEvent(socket.id)) {
        ack?.({ ok: false, error: 'RATE_LIMITED' });
        return;
      }

      const member = await prisma.conversationMember.findFirst({ where: { orgId, conversationId, userId } });
      if (!member) {
        ack?.({ ok: false, error: 'NOT_IN_CONVERSATION' });
        return;
      }

      app.publishRealtimeEvent(orgId, 'typing.started', { userId, conversationId }, [`conversation:${conversationId}`]);
      ack?.({ ok: true });
    });

    socket.on('typing.stop', async (conversationId: string, ack?: (data: Record<string, unknown>) => void) => {
      const member = await prisma.conversationMember.findFirst({ where: { orgId, conversationId, userId } });
      if (!member) {
        ack?.({ ok: false, error: 'NOT_IN_CONVERSATION' });
        return;
      }

      app.publishRealtimeEvent(orgId, 'typing.stopped', { userId, conversationId }, [`conversation:${conversationId}`]);
      ack?.({ ok: true });
    });

    socket.on('disconnect', () => {
      typingRateBySocket.delete(socket.id);
      const orgPresenceMap = presenceByOrg.get(orgId) ?? new Map<string, { status: string; lastSeenAt: string }>();
      orgPresenceMap.set(userId, { status: 'offline', lastSeenAt: new Date().toISOString() });
      presenceByOrg.set(orgId, orgPresenceMap);
      app.publishRealtimeEvent(orgId, 'presence.updated', { userId, status: 'offline' });
    });
  });

  app.decorate('io', io);
  app.addHook('onClose', async () => io.close());
});
