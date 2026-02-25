import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { orgDal } from '../lib/orgScopedDal';
import { hasPermission } from '../services/rbac';
import { recordAudit } from '../services/audit';
import { decodeCursor, encodeCursor, parseMentions } from '../services/messaging';
import { getEventsAfterSequence, getLatestSequence } from '../services/realtimeEvents';

function requireReadPermission(roles: string[]) {
  return hasPermission(roles, 'message.read') || hasPermission(roles, 'message.send');
}

async function assertConversationMembership(orgId: string, conversationId: string, userId: string) {
  const membership = await prisma.conversationMember.findFirst({ where: { orgId, conversationId, userId } });
  if (!membership) throw new Error('NOT_IN_CONVERSATION');
}

export const messagingRoutes: FastifyPluginAsync = async (app) => {

  app.get('/realtime/events/resync', { preHandler: app.authenticate }, async (request) => {
    if (!requireReadPermission(request.auth!.roles)) throw app.httpErrors.forbidden('Insufficient permissions');

    const query = z.object({ lastSeq: z.coerce.number().int().min(0).default(0), limit: z.coerce.number().int().min(1).max(500).default(200) }).parse(request.query);
    const events = getEventsAfterSequence(request.auth!.orgId, query.lastSeq, query.limit);
    return { events, latestSeq: getLatestSequence(request.auth!.orgId) };
  });

  app.post('/conversations', { preHandler: app.authenticate }, async (request) => {
    if (!hasPermission(request.auth!.roles, 'message.send')) throw app.httpErrors.forbidden('Insufficient permissions');

    const body = z.object({
      workspaceId: z.string().cuid().optional(),
      type: z.enum(['CHANNEL_PUBLIC', 'CHANNEL_PRIVATE', 'DM', 'GROUP_DM']),
      name: z.string().optional(),
      memberIds: z.array(z.string().cuid()).default([])
    }).parse(request.body);

    const dal = orgDal(request.auth!.orgId);
    const conversation = (await dal.conversations.create({
      orgId: request.auth!.orgId,
      workspaceId: body.workspaceId,
      type: body.type,
      name: body.name,
      createdBy: request.auth!.userId,
      members: {
        create: [{ orgId: request.auth!.orgId, userId: request.auth!.userId }, ...body.memberIds.map((id) => ({ orgId: request.auth!.orgId, userId: id }))]
      }
    })) as any;

    await recordAudit({ orgId: request.auth!.orgId, actorId: request.auth!.userId, action: 'conversation.create', targetType: 'conversation', targetId: conversation.id });
    return conversation;
  });

  app.get('/conversations/:conversationId/messages', { preHandler: app.authenticate }, async (request) => {
    if (!requireReadPermission(request.auth!.roles)) throw app.httpErrors.forbidden('Insufficient permissions');

    const params = z.object({ conversationId: z.string().cuid() }).parse(request.params);
    const query = z.object({ limit: z.coerce.number().min(1).max(100).default(50), cursor: z.string().optional() }).parse(request.query);

    try { await assertConversationMembership(request.auth!.orgId, params.conversationId, request.auth!.userId); } catch { throw app.httpErrors.forbidden('Not in conversation'); }

    const cursor = decodeCursor(query.cursor);
    const rows = await prisma.message.findMany({
      where: {
        orgId: request.auth!.orgId,
        conversationId: params.conversationId,
        ...(cursor
          ? { OR: [{ createdAt: { gt: new Date(cursor.createdAt) } }, { createdAt: new Date(cursor.createdAt), id: { gt: cursor.id } }] }
          : {})
      },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      take: query.limit + 1
    });

    const hasMore = rows.length > query.limit;
    const items = hasMore ? rows.slice(0, query.limit) : rows;
    const nextCursor = hasMore ? encodeCursor({ createdAt: items[items.length - 1].createdAt.toISOString(), id: items[items.length - 1].id }) : null;
    return { items, nextCursor };
  });

  app.get('/conversations/:conversationId/messages/resync', { preHandler: app.authenticate }, async (request) => {
    if (!requireReadPermission(request.auth!.roles)) throw app.httpErrors.forbidden('Insufficient permissions');

    const params = z.object({ conversationId: z.string().cuid() }).parse(request.params);
    const query = z.object({ since: z.string().datetime() }).parse(request.query);

    try { await assertConversationMembership(request.auth!.orgId, params.conversationId, request.auth!.userId); } catch { throw app.httpErrors.forbidden('Not in conversation'); }

    const messages = await prisma.message.findMany({
      where: { orgId: request.auth!.orgId, conversationId: params.conversationId, createdAt: { gt: new Date(query.since) } },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      take: 500
    });
    return { items: messages };
  });

  app.post('/conversations/:conversationId/messages', { preHandler: app.authenticate }, async (request) => {
    if (!hasPermission(request.auth!.roles, 'message.send')) throw app.httpErrors.forbidden('Insufficient permissions');

    const params = z.object({ conversationId: z.string().cuid() }).parse(request.params);
    const body = z.object({ body: z.string().min(1), idempotencyKey: z.string().min(8), replyToMessageId: z.string().cuid().optional() }).parse(request.body);

    try { await assertConversationMembership(request.auth!.orgId, params.conversationId, request.auth!.userId); } catch { throw app.httpErrors.forbidden('Not in conversation'); }

    if (body.replyToMessageId) {
      const parent = await prisma.message.findFirst({ where: { orgId: request.auth!.orgId, id: body.replyToMessageId, conversationId: params.conversationId } });
      if (!parent) throw app.httpErrors.badRequest('Invalid thread parent message');
    }

    const dal = orgDal(request.auth!.orgId);
    const mentions = parseMentions(body.body);
    const message = (await dal.messages.create({
      orgId: request.auth!.orgId,
      conversationId: params.conversationId,
      senderId: request.auth!.userId,
      body: body.body,
      markdownBody: body.body,
      replyToMessageId: body.replyToMessageId
    })) as any;

    await recordAudit({ orgId: request.auth!.orgId, actorId: request.auth!.userId, action: 'message.create', targetType: 'message', targetId: message.id, metadata: { conversationId: params.conversationId, mentions } });
    app.publishRealtimeEvent(request.auth!.orgId, 'message.created', { message }, [`conversation:${message.conversationId}`]);
    return { message, mentions, idempotencyKey: body.idempotencyKey };
  });

  app.get('/conversations/:conversationId/messages/:messageId/thread', { preHandler: app.authenticate }, async (request) => {
    if (!requireReadPermission(request.auth!.roles)) throw app.httpErrors.forbidden('Insufficient permissions');

    const params = z.object({ conversationId: z.string().cuid(), messageId: z.string().cuid() }).parse(request.params);
    try { await assertConversationMembership(request.auth!.orgId, params.conversationId, request.auth!.userId); } catch { throw app.httpErrors.forbidden('Not in conversation'); }

    return prisma.message.findMany({
      where: { orgId: request.auth!.orgId, conversationId: params.conversationId, OR: [{ id: params.messageId }, { replyToMessageId: params.messageId }] },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }]
    });
  });

  app.patch('/conversations/:conversationId/messages/:messageId', { preHandler: app.authenticate }, async (request) => {
    if (!hasPermission(request.auth!.roles, 'message.send')) throw app.httpErrors.forbidden('Insufficient permissions');

    const params = z.object({ conversationId: z.string().cuid(), messageId: z.string().cuid() }).parse(request.params);
    const body = z.object({ body: z.string().min(1) }).parse(request.body);

    try { await assertConversationMembership(request.auth!.orgId, params.conversationId, request.auth!.userId); } catch { throw app.httpErrors.forbidden('Not in conversation'); }

    const message = await prisma.message.findFirst({ where: { orgId: request.auth!.orgId, id: params.messageId, conversationId: params.conversationId } });
    if (!message) throw app.httpErrors.notFound('Message not found');

    const canModerate = hasPermission(request.auth!.roles, 'channel.manage');
    if (message.senderId !== request.auth!.userId && !canModerate) throw app.httpErrors.forbidden('Cannot edit this message');

    const mentions = parseMentions(body.body);
    const [updated] = await prisma.$transaction([
      prisma.message.update({ where: { id: message.id }, data: { body: body.body, markdownBody: body.body, editedAt: new Date() } }),
      prisma.messageEdit.create({ data: { orgId: request.auth!.orgId, messageId: message.id, previousBody: message.body, editedBy: request.auth!.userId } })
    ]);

    await recordAudit({ orgId: request.auth!.orgId, actorId: request.auth!.userId, action: 'message.edit', targetType: 'message', targetId: message.id, metadata: { conversationId: params.conversationId, mentions } });
    app.publishRealtimeEvent(request.auth!.orgId, 'message.updated', { message: updated }, [`conversation:${params.conversationId}`]);
    return { message: updated, mentions };
  });

  app.get('/conversations/:conversationId/messages/:messageId/edits', { preHandler: app.authenticate }, async (request) => {
    if (!requireReadPermission(request.auth!.roles)) throw app.httpErrors.forbidden('Insufficient permissions');

    const params = z.object({ conversationId: z.string().cuid(), messageId: z.string().cuid() }).parse(request.params);
    try { await assertConversationMembership(request.auth!.orgId, params.conversationId, request.auth!.userId); } catch { throw app.httpErrors.forbidden('Not in conversation'); }

    return prisma.messageEdit.findMany({ where: { orgId: request.auth!.orgId, messageId: params.messageId }, orderBy: { editedAt: 'desc' } });
  });

  app.delete('/conversations/:conversationId/messages/:messageId', { preHandler: app.authenticate }, async (request) => {
    if (!hasPermission(request.auth!.roles, 'message.send')) throw app.httpErrors.forbidden('Insufficient permissions');

    const params = z.object({ conversationId: z.string().cuid(), messageId: z.string().cuid() }).parse(request.params);
    try { await assertConversationMembership(request.auth!.orgId, params.conversationId, request.auth!.userId); } catch { throw app.httpErrors.forbidden('Not in conversation'); }

    const message = await prisma.message.findFirst({ where: { orgId: request.auth!.orgId, id: params.messageId, conversationId: params.conversationId } });
    if (!message) throw app.httpErrors.notFound('Message not found');

    const canModerate = hasPermission(request.auth!.roles, 'channel.manage');
    if (message.senderId !== request.auth!.userId && !canModerate) throw app.httpErrors.forbidden('Cannot delete this message');

    const deleted = await prisma.message.update({ where: { id: message.id }, data: { isDeleted: true, body: '', markdownBody: null, editedAt: new Date() } });

    await recordAudit({ orgId: request.auth!.orgId, actorId: request.auth!.userId, action: 'message.delete_soft', targetType: 'message', targetId: message.id, metadata: { conversationId: params.conversationId } });
    app.publishRealtimeEvent(request.auth!.orgId, 'message.deleted', { message: deleted }, [`conversation:${params.conversationId}`]);
    return { ok: true };
  });

  app.post('/conversations/:conversationId/messages/:messageId/reactions', { preHandler: app.authenticate }, async (request) => {
    if (!hasPermission(request.auth!.roles, 'message.send')) throw app.httpErrors.forbidden('Insufficient permissions');

    const params = z.object({ conversationId: z.string().cuid(), messageId: z.string().cuid() }).parse(request.params);
    const body = z.object({ emoji: z.string().min(1).max(16) }).parse(request.body);
    try { await assertConversationMembership(request.auth!.orgId, params.conversationId, request.auth!.userId); } catch { throw app.httpErrors.forbidden('Not in conversation'); }

    const reaction = await prisma.messageReaction.upsert({
      where: { messageId_userId_emoji: { messageId: params.messageId, userId: request.auth!.userId, emoji: body.emoji } },
      create: { orgId: request.auth!.orgId, messageId: params.messageId, userId: request.auth!.userId, emoji: body.emoji },
      update: {}
    });

    await recordAudit({ orgId: request.auth!.orgId, actorId: request.auth!.userId, action: 'message.reaction_add', targetType: 'message', targetId: params.messageId, metadata: { emoji: body.emoji, conversationId: params.conversationId } });
    return reaction;
  });

  app.delete('/conversations/:conversationId/messages/:messageId/reactions/:emoji', { preHandler: app.authenticate }, async (request) => {
    if (!hasPermission(request.auth!.roles, 'message.send')) throw app.httpErrors.forbidden('Insufficient permissions');

    const params = z.object({ conversationId: z.string().cuid(), messageId: z.string().cuid(), emoji: z.string().min(1).max(16) }).parse(request.params);
    try { await assertConversationMembership(request.auth!.orgId, params.conversationId, request.auth!.userId); } catch { throw app.httpErrors.forbidden('Not in conversation'); }

    await prisma.messageReaction.deleteMany({ where: { orgId: request.auth!.orgId, messageId: params.messageId, userId: request.auth!.userId, emoji: params.emoji } });
    await recordAudit({ orgId: request.auth!.orgId, actorId: request.auth!.userId, action: 'message.reaction_remove', targetType: 'message', targetId: params.messageId, metadata: { emoji: params.emoji, conversationId: params.conversationId } });
    return { ok: true };
  });
};
