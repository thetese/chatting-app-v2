import { prisma } from '../lib/prisma';

type AuditInput = {
  orgId: string;
  actorId?: string;
  action: string;
  targetType: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  requestId?: string;
};

export async function recordAudit(input: AuditInput) {
  await prisma.auditLog.create({
    data: {
      ...input,
      metadata: input.metadata ?? {}
    }
  });
}
