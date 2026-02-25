import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { orgDal } from '../lib/orgScopedDal';
import { hasPermission, permissionsMatrix } from '../services/rbac';
import { recordAudit } from '../services/audit';
import { applyMessageExportPolicy, canIncludeContent } from '../services/compliance';

function requirePermission(app: any, roles: string[], permission: string) {
  if (!hasPermission(roles, permission)) {
    throw app.httpErrors.forbidden('Not allowed');
  }
}

export const adminRoutes: FastifyPluginAsync = async (app) => {
  app.get('/admin/sessions', { preHandler: app.authenticate }, async (request) => {
    requirePermission(app, request.auth!.roles, 'security.manage');
    const dal = orgDal(request.auth!.orgId);
    return dal.sessions.findMany();
  });

  app.post('/admin/sessions/revoke', { preHandler: app.authenticate }, async (request) => {
    requirePermission(app, request.auth!.roles, 'security.manage');
    const body = z.object({ sessionId: z.string().cuid() }).parse(request.body);
    const dal = orgDal(request.auth!.orgId);
    await dal.sessions.updateMany({ id: body.sessionId }, { status: 'REVOKED' });
    await recordAudit({ orgId: request.auth!.orgId, actorId: request.auth!.userId, action: 'session.revoke', targetType: 'session', targetId: body.sessionId });
    return { ok: true };
  });

  app.post('/admin/sessions/revoke-all', { preHandler: app.authenticate }, async (request) => {
    requirePermission(app, request.auth!.roles, 'security.manage');
    const body = z.object({ userId: z.string().cuid().optional() }).parse(request.body ?? {});
    const targetUserId = body.userId;
    const where = targetUserId ? { orgId: request.auth!.orgId, userId: targetUserId } : { orgId: request.auth!.orgId };
    const result = await prisma.session.updateMany({ where, data: { status: 'REVOKED' } });
    await recordAudit({ orgId: request.auth!.orgId, actorId: request.auth!.userId, action: 'session.revoke_all', targetType: targetUserId ? 'user' : 'org', targetId: targetUserId ?? request.auth!.orgId, metadata: { revokedCount: result.count } });
    return { revokedCount: result.count };
  });

  app.get('/admin/users', { preHandler: app.authenticate }, async (request) => {
    requirePermission(app, request.auth!.roles, 'org.manage');
    return prisma.user.findMany({
      where: { orgId: request.auth!.orgId },
      select: {
        id: true,
        email: true,
        name: true,
        status: true,
        createdAt: true,
        orgMemberships: { where: { orgId: request.auth!.orgId }, select: { role: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  });

  app.patch('/admin/users/:userId', { preHandler: app.authenticate }, async (request) => {
    requirePermission(app, request.auth!.roles, 'org.manage');
    const params = z.object({ userId: z.string().cuid() }).parse(request.params);
    const body = z.object({ status: z.enum(['active', 'suspended']).optional(), name: z.string().min(1).optional() }).parse(request.body);

    const user = await prisma.user.findFirst({ where: { id: params.userId, orgId: request.auth!.orgId } });
    if (!user) throw app.httpErrors.notFound('User not found');

    const updated = await prisma.user.update({ where: { id: user.id }, data: body });
    await recordAudit({ orgId: request.auth!.orgId, actorId: request.auth!.userId, action: 'admin.user_updated', targetType: 'user', targetId: user.id, metadata: body });
    return updated;
  });

  app.patch('/admin/users/:userId/roles', { preHandler: app.authenticate }, async (request) => {
    requirePermission(app, request.auth!.roles, 'org.manage');
    const params = z.object({ userId: z.string().cuid() }).parse(request.params);
    const body = z.object({ roles: z.array(z.enum(['OWNER', 'ADMIN', 'SECURITY_ADMIN', 'COMPLIANCE_ADMIN', 'MEMBER', 'GUEST'])).min(1) }).parse(request.body);

    const user = await prisma.user.findFirst({ where: { id: params.userId, orgId: request.auth!.orgId } });
    if (!user) throw app.httpErrors.notFound('User not found');

    await prisma.$transaction([
      prisma.orgMembership.deleteMany({ where: { orgId: request.auth!.orgId, userId: user.id } }),
      prisma.orgMembership.createMany({ data: body.roles.map((role) => ({ orgId: request.auth!.orgId, userId: user.id, role })) })
    ]);

    await recordAudit({ orgId: request.auth!.orgId, actorId: request.auth!.userId, action: 'admin.user_roles_updated', targetType: 'user', targetId: user.id, metadata: { roles: body.roles } });
    return { userId: user.id, roles: body.roles };
  });

  app.get('/admin/roles', { preHandler: app.authenticate }, async (request) => {
    requirePermission(app, request.auth!.roles, 'org.manage');
    return permissionsMatrix;
  });

  app.get('/admin/security-policies', { preHandler: app.authenticate }, async (request) => {
    requirePermission(app, request.auth!.roles, 'security.manage');
    const org = await prisma.organization.findUniqueOrThrow({ where: { id: request.auth!.orgId } });
    const settings = (org.settings as Record<string, unknown>) || {};
    return {
      mfaRequired: Boolean(settings.mfaRequired),
      ssoRequired: Boolean(settings.ssoRequired),
      allowedAuthMethods: org.allowedAuthMethods
    };
  });

  app.put('/admin/security-policies', { preHandler: app.authenticate }, async (request) => {
    requirePermission(app, request.auth!.roles, 'security.manage');
    const body = z.object({ mfaRequired: z.boolean(), ssoRequired: z.boolean(), allowedAuthMethods: z.array(z.string()).min(1) }).parse(request.body);

    const org = await prisma.organization.findUniqueOrThrow({ where: { id: request.auth!.orgId } });
    const settings = (org.settings as Record<string, unknown>) || {};
    const updated = await prisma.organization.update({
      where: { id: org.id },
      data: {
        settings: { ...settings, mfaRequired: body.mfaRequired, ssoRequired: body.ssoRequired },
        allowedAuthMethods: body.allowedAuthMethods
      }
    });

    await recordAudit({ orgId: org.id, actorId: request.auth!.userId, action: 'admin.security_policies_updated', targetType: 'org', targetId: org.id, metadata: body });
    return updated;
  });

  app.get('/admin/retention-policy', { preHandler: app.authenticate }, async (request) => {
    requirePermission(app, request.auth!.roles, 'retention.manage');
    const org = await prisma.organization.findUniqueOrThrow({ where: { id: request.auth!.orgId } });
    return { retentionDays: org.retentionDays, complianceSettings: org.complianceSettings };
  });

  app.put('/admin/retention-policy', { preHandler: app.authenticate }, async (request) => {
    requirePermission(app, request.auth!.roles, 'retention.manage');
    const body = z.object({ retentionDays: z.number().int().min(1).max(3650), complianceSettings: z.record(z.any()).optional() }).parse(request.body);

    const org = await prisma.organization.update({
      where: { id: request.auth!.orgId },
      data: {
        retentionDays: body.retentionDays,
        complianceSettings: body.complianceSettings ?? undefined
      }
    });

    await recordAudit({ orgId: org.id, actorId: request.auth!.userId, action: 'admin.retention_policy_updated', targetType: 'org', targetId: org.id, metadata: body });
    return { retentionDays: org.retentionDays, complianceSettings: org.complianceSettings };
  });

  app.get('/admin/audit-logs', { preHandler: app.authenticate }, async (request) => {
    if (!hasPermission(request.auth!.roles, 'compliance.export') && !hasPermission(request.auth!.roles, 'security.manage')) {
      throw app.httpErrors.forbidden('Not allowed');
    }

    const query = z.object({
      limit: z.coerce.number().int().min(1).max(200).default(50),
      cursor: z.string().optional(),
      action: z.string().optional()
    }).parse(request.query);

    const cursor = query.cursor ? JSON.parse(Buffer.from(query.cursor, 'base64url').toString('utf8')) : null;

    const rows = await prisma.auditLog.findMany({
      where: {
        orgId: request.auth!.orgId,
        ...(query.action ? { action: query.action } : {}),
        ...(cursor ? {
          OR: [
            { createdAt: { lt: new Date(cursor.createdAt) } },
            { createdAt: new Date(cursor.createdAt), id: { lt: cursor.id } }
          ]
        } : {})
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: query.limit + 1
    });

    const hasMore = rows.length > query.limit;
    const items = hasMore ? rows.slice(0, query.limit) : rows;
    const nextCursor = hasMore
      ? Buffer.from(JSON.stringify({ createdAt: items[items.length - 1].createdAt.toISOString(), id: items[items.length - 1].id }), 'utf8').toString('base64url')
      : null;

    return { items, nextCursor };
  });


  app.post('/admin/legal-holds', { preHandler: app.authenticate }, async (request) => {
    requirePermission(app, request.auth!.roles, 'compliance.export');
    const body = z.object({ scopeType: z.enum(['conversation', 'user']), scopeId: z.string().cuid(), reason: z.string().min(3) }).parse(request.body);

    const hold = await prisma.legalHold.create({
      data: {
        orgId: request.auth!.orgId,
        scopeType: body.scopeType,
        scopeId: body.scopeId,
        reason: body.reason,
        ownerId: request.auth!.userId,
        active: true
      }
    });

    await recordAudit({
      orgId: request.auth!.orgId,
      actorId: request.auth!.userId,
      action: 'legal_hold.created',
      targetType: 'legal_hold',
      targetId: hold.id,
      metadata: body
    });

    return hold;
  });

  app.get('/admin/legal-holds', { preHandler: app.authenticate }, async (request) => {
    requirePermission(app, request.auth!.roles, 'compliance.export');
    return prisma.legalHold.findMany({ where: { orgId: request.auth!.orgId }, orderBy: { createdAt: 'desc' } });
  });

  app.patch('/admin/legal-holds/:holdId/release', { preHandler: app.authenticate }, async (request) => {
    requirePermission(app, request.auth!.roles, 'compliance.export');
    const params = z.object({ holdId: z.string().cuid() }).parse(request.params);

    const hold = await prisma.legalHold.findFirst({ where: { id: params.holdId, orgId: request.auth!.orgId } });
    if (!hold) throw app.httpErrors.notFound('Legal hold not found');

    const updated = await prisma.legalHold.update({ where: { id: hold.id }, data: { active: false } });
    await recordAudit({ orgId: request.auth!.orgId, actorId: request.auth!.userId, action: 'legal_hold.released', targetType: 'legal_hold', targetId: hold.id });
    return updated;
  });

  app.post('/admin/retention/jobs/run', { preHandler: app.authenticate }, async (request) => {
    requirePermission(app, request.auth!.roles, 'retention.manage');

    const org = await prisma.organization.findUniqueOrThrow({ where: { id: request.auth!.orgId } });
    const threshold = new Date(Date.now() - org.retentionDays * 24 * 60 * 60 * 1000);
    const legalHolds = await prisma.legalHold.findMany({ where: { orgId: org.id, active: true } });
    const heldConversationIds = legalHolds.filter((h) => h.scopeType === 'conversation').map((h) => h.scopeId);
    const heldUserIds = legalHolds.filter((h) => h.scopeType === 'user').map((h) => h.scopeId);

    const result = await prisma.message.deleteMany({
      where: {
        orgId: org.id,
        createdAt: { lt: threshold },
        conversationId: { notIn: heldConversationIds },
        senderId: { notIn: heldUserIds }
      }
    });

    await recordAudit({
      orgId: org.id,
      actorId: request.auth!.userId,
      action: 'retention.job_ran',
      targetType: 'org',
      targetId: org.id,
      metadata: { deletedMessages: result.count, heldConversationIds, heldUserIds, threshold: threshold.toISOString() }
    });

    return { deletedMessages: result.count, heldConversationIds, heldUserIds, threshold };
  });

  app.post('/admin/ediscovery/exports', { preHandler: app.authenticate }, async (request) => {
    requirePermission(app, request.auth!.roles, 'compliance.export');

    const body = z.object({
      conversationIds: z.array(z.string().cuid()).optional(),
      userIds: z.array(z.string().cuid()).optional(),
      from: z.string().datetime().optional(),
      to: z.string().datetime().optional(),
      includeFiles: z.boolean().default(true)
    }).parse(request.body ?? {});

    const org = await prisma.organization.findUniqueOrThrow({ where: { id: request.auth!.orgId } });
    const includeContent = canIncludeContent(org.complianceSettings);

    const messageWhere: Record<string, unknown> = {
      orgId: request.auth!.orgId,
      ...(body.conversationIds?.length ? { conversationId: { in: body.conversationIds } } : {}),
      ...(body.userIds?.length ? { senderId: { in: body.userIds } } : {}),
      ...((body.from || body.to) ? {
        createdAt: {
          ...(body.from ? { gte: new Date(body.from) } : {}),
          ...(body.to ? { lte: new Date(body.to) } : {})
        }
      } : {})
    };

    const messages = await prisma.message.findMany({ where: messageWhere as any, orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] });
    const exportedMessages = applyMessageExportPolicy(messages, includeContent);

    let files: unknown[] = [];
    if (body.includeFiles) {
      files = await prisma.fileObject.findMany({
        where: {
          orgId: request.auth!.orgId,
          ...(body.conversationIds?.length ? { conversationId: { in: body.conversationIds } } : {})
        },
        orderBy: { createdAt: 'asc' }
      });
    }

    const payload = {
      orgId: request.auth!.orgId,
      generatedAt: new Date().toISOString(),
      scope: body,
      includeContent,
      counts: { messages: exportedMessages.length, files: files.length },
      messages: exportedMessages,
      files
    };

    await recordAudit({
      orgId: request.auth!.orgId,
      actorId: request.auth!.userId,
      action: 'ediscovery.export_created',
      targetType: 'org',
      targetId: request.auth!.orgId,
      metadata: {
        scope: body,
        includeContent,
        messageCount: exportedMessages.length,
        fileCount: files.length
      }
    });

    return payload;
  });

  app.post('/admin/retention/run', { preHandler: app.authenticate }, async (request) => {
    requirePermission(app, request.auth!.roles, 'retention.manage');

    const org = await prisma.organization.findUniqueOrThrow({ where: { id: request.auth!.orgId } });
    const threshold = new Date(Date.now() - org.retentionDays * 24 * 60 * 60 * 1000);
    const legalHolds = await prisma.legalHold.findMany({ where: { orgId: org.id, active: true } });
    const heldConversationIds = legalHolds.filter((h) => h.scopeType === 'conversation').map((h) => h.scopeId);

    const result = await prisma.message.deleteMany({
      where: {
        orgId: org.id,
        createdAt: { lt: threshold },
        conversationId: { notIn: heldConversationIds }
      }
    });

    await recordAudit({ orgId: org.id, actorId: request.auth!.userId, action: 'retention.run', targetType: 'org', targetId: org.id, metadata: { deletedMessages: result.count } });
    return { deletedMessages: result.count };
  });
};
