import crypto from 'node:crypto';
import { prisma } from '../lib/prisma';

export function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function rotateRefreshSession(args: {
  sessionId: string;
  presentedRefreshToken: string;
  nextRefreshToken: string;
  expiresAt: Date;
}) {
  const session = await prisma.session.findUnique({ where: { id: args.sessionId } });
  if (!session || session.status === 'REVOKED') {
    throw new Error('SESSION_REVOKED');
  }

  if (session.refreshTokenHash !== hashToken(args.presentedRefreshToken)) {
    await prisma.session.updateMany({ where: { familyId: session.familyId }, data: { status: 'REVOKED' } });
    throw new Error('TOKEN_REUSE_DETECTED');
  }

  return prisma.session.create({
    data: {
      orgId: session.orgId,
      userId: session.userId,
      familyId: session.familyId,
      parentSessionId: session.id,
      refreshTokenHash: hashToken(args.nextRefreshToken),
      expiresAt: args.expiresAt
    }
  });
}
