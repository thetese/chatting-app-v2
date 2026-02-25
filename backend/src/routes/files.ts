import { FastifyPluginAsync } from 'fastify';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { hasPermission } from '../services/rbac';
import { recordAudit } from '../services/audit';
import { createSignedUrlToken } from '../services/fileSigning';
import { env } from '../config/env';

async function ensureConversationMembership(orgId: string, conversationId: string, userId: string) {
  const member = await prisma.conversationMember.findFirst({ where: { orgId, conversationId, userId } });
  return Boolean(member);
}

export const fileRoutes: FastifyPluginAsync = async (app) => {
  app.post('/files/upload-url', { preHandler: app.authenticate }, async (request) => {
    if (!hasPermission(request.auth!.roles, 'message.send')) {
      throw app.httpErrors.forbidden('Insufficient permissions');
    }

    const body = z.object({
      conversationId: z.string().cuid(),
      fileName: z.string().min(1),
      mimeType: z.string().min(1),
      sizeBytes: z.number().int().positive().max(100 * 1024 * 1024)
    }).parse(request.body);

    const isMember = await ensureConversationMembership(request.auth!.orgId, body.conversationId, request.auth!.userId);
    if (!isMember) {
      throw app.httpErrors.forbidden('Not in conversation');
    }

    const storageKey = `quarantine/${request.auth!.orgId}/${body.conversationId}/${randomUUID()}-${body.fileName}`;
    const file = await prisma.fileObject.create({
      data: {
        orgId: request.auth!.orgId,
        conversationId: body.conversationId,
        uploaderId: request.auth!.userId,
        fileName: body.fileName,
        mimeType: body.mimeType,
        sizeBytes: body.sizeBytes,
        status: 'QUARANTINED',
        storageKey,
        scanResult: 'PENDING'
      }
    });

    const token = createSignedUrlToken({ orgId: request.auth!.orgId, fileId: file.id, operation: 'upload' }, env.STORAGE_SIGNING_SECRET, 60 * 10);
    const uploadUrl = `${env.OBJECT_STORAGE_BASE_URL}/upload/${encodeURIComponent(storageKey)}?token=${token}`;

    await recordAudit({
      orgId: request.auth!.orgId,
      actorId: request.auth!.userId,
      action: 'file.upload_url_issued',
      targetType: 'file',
      targetId: file.id,
      metadata: { conversationId: body.conversationId, storageKey, status: 'QUARANTINED' },
      ipAddress: request.ip
    });

    return { fileId: file.id, uploadUrl, expiresInSeconds: 600 };
  });

  app.get('/files/:fileId/download-url', { preHandler: app.authenticate }, async (request) => {
    if (!hasPermission(request.auth!.roles, 'message.read') && !hasPermission(request.auth!.roles, 'message.send')) {
      throw app.httpErrors.forbidden('Insufficient permissions');
    }

    const params = z.object({ fileId: z.string().cuid() }).parse(request.params);
    const file = await prisma.fileObject.findFirst({ where: { id: params.fileId, orgId: request.auth!.orgId } });
    if (!file) {
      throw app.httpErrors.notFound('File not found');
    }

    const isMember = await ensureConversationMembership(request.auth!.orgId, file.conversationId, request.auth!.userId);
    if (!isMember) {
      throw app.httpErrors.forbidden('Not in conversation');
    }

    if (file.status !== 'CLEAN') {
      throw app.httpErrors.forbidden('File is not available for download');
    }

    const token = createSignedUrlToken({ orgId: request.auth!.orgId, fileId: file.id, operation: 'download' }, env.STORAGE_SIGNING_SECRET, 60 * 5);
    const downloadUrl = `${env.OBJECT_STORAGE_BASE_URL}/download/${encodeURIComponent(file.storageKey)}?token=${token}`;

    await recordAudit({
      orgId: request.auth!.orgId,
      actorId: request.auth!.userId,
      action: 'file.download_url_issued',
      targetType: 'file',
      targetId: file.id,
      metadata: { conversationId: file.conversationId, storageKey: file.storageKey },
      ipAddress: request.ip
    });

    return { fileId: file.id, downloadUrl, expiresInSeconds: 300 };
  });

  app.get('/files/:fileId', { preHandler: app.authenticate }, async (request) => {
    const params = z.object({ fileId: z.string().cuid() }).parse(request.params);
    const file = await prisma.fileObject.findFirst({ where: { id: params.fileId, orgId: request.auth!.orgId } });
    if (!file) {
      throw app.httpErrors.notFound('File not found');
    }

    const isMember = await ensureConversationMembership(request.auth!.orgId, file.conversationId, request.auth!.userId);
    if (!isMember) {
      throw app.httpErrors.forbidden('Not in conversation');
    }

    return file;
  });

  app.post('/internal/files/:fileId/scan-result', async (request) => {
    const scannerSecret = request.headers['x-malware-scan-secret'];
    if (scannerSecret !== env.MALWARE_SCAN_SECRET) {
      throw app.httpErrors.unauthorized('Invalid scanner secret');
    }

    const params = z.object({ fileId: z.string().cuid() }).parse(request.params);
    const body = z.object({ verdict: z.enum(['CLEAN', 'INFECTED']), signature: z.string().optional() }).parse(request.body);

    const file = await prisma.fileObject.findUnique({ where: { id: params.fileId } });
    if (!file) {
      throw app.httpErrors.notFound('File not found');
    }

    if (file.status === 'BLOCKED' || file.status === 'CLEAN') {
      return { ok: true, status: file.status };
    }

    const nextStatus = body.verdict === 'CLEAN' ? 'CLEAN' : 'BLOCKED';
    const releasedStorageKey = body.verdict === 'CLEAN'
      ? file.storageKey.replace(/^quarantine\//, 'clean/')
      : file.storageKey;

    const updated = await prisma.fileObject.update({
      where: { id: file.id },
      data: {
        status: nextStatus,
        storageKey: releasedStorageKey,
        scanResult: body.verdict
      }
    });

    await recordAudit({
      orgId: file.orgId,
      action: 'file.scan_completed',
      targetType: 'file',
      targetId: file.id,
      metadata: {
        previousStatus: file.status,
        nextStatus,
        verdict: body.verdict,
        signature: body.signature ?? null,
        oldStorageKey: file.storageKey,
        newStorageKey: releasedStorageKey
      }
    });

    if (body.verdict === 'CLEAN') {
      await recordAudit({
        orgId: file.orgId,
        action: 'file.released',
        targetType: 'file',
        targetId: file.id,
        metadata: { conversationId: file.conversationId, storageKey: releasedStorageKey }
      });
    } else {
      await recordAudit({
        orgId: file.orgId,
        action: 'file.blocked',
        targetType: 'file',
        targetId: file.id,
        metadata: { conversationId: file.conversationId, reason: 'malware_detected' }
      });
    }

    return { ok: true, status: updated.status, scanResult: updated.scanResult };
  });
};
