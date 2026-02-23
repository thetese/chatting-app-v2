import fp from 'fastify-plugin';
import type { FastifyRequest } from 'fastify';
import { prisma } from '../lib/prisma';
import { AuthContext } from '../types/auth';

declare module 'fastify' {
  interface FastifyRequest {
    auth?: AuthContext;
  }

  interface FastifyInstance {
    authenticate: (request: FastifyRequest) => Promise<void>;
  }
}

export default fp(async function authPlugin(app) {
  app.decorate('authenticate', async (request: FastifyRequest) => {
    const payload = await request.jwtVerify<{ sub: string; orgId: string; sessionId: string }>();
    const memberships = await prisma.orgMembership.findMany({
      where: { orgId: payload.orgId, userId: payload.sub }
    });

    request.auth = {
      orgId: payload.orgId,
      userId: payload.sub,
      sessionId: payload.sessionId,
      roles: memberships.map((membership) => membership.role)
    };
  });
});
