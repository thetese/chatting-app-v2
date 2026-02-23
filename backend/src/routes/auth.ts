import argon2 from 'argon2';
import { authenticator } from 'otplib';
import { createHash, randomBytes } from 'node:crypto';
import { z } from 'zod';
import { FastifyPluginAsync } from 'fastify';
import { prisma } from '../lib/prisma';
import { orgDal } from '../lib/orgScopedDal';
import { recordAudit } from '../services/audit';
import { hashToken, rotateRefreshSession } from '../services/session';
import { clearFailedLogins, isUserLocked, registerFailedLogin } from '../services/authSecurity';

const ACCESS_TTL_SECONDS = 60 * 10;
const REFRESH_TTL_DAYS = 30;
const EMAIL_TOKEN_TTL_HOURS = 24;
const RESET_TOKEN_TTL_MINUTES = 30;

const registerSchema = z.object({
  orgId: z.string().cuid(),
  email: z.string().email(),
  password: z.string().min(12),
  name: z.string().min(1)
});

function tokenHash(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export const authRoutes: FastifyPluginAsync = async (app) => {
  app.post('/auth/register', { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } }, async (request, reply) => {
    const body = registerSchema.parse(request.body);
    const hash = await argon2.hash(body.password, { type: argon2.argon2id });
    const verificationToken = randomBytes(32).toString('hex');

    const user = await prisma.user.create({
      data: {
        orgId: body.orgId,
        email: body.email,
        name: body.name,
        passwordHash: hash,
        authMethods: ['password']
      }
    });

    await prisma.orgMembership.create({ data: { orgId: body.orgId, userId: user.id, role: 'MEMBER' } });
    await prisma.emailVerificationToken.create({
      data: {
        orgId: body.orgId,
        userId: user.id,
        tokenHash: tokenHash(verificationToken),
        expiresAt: new Date(Date.now() + EMAIL_TOKEN_TTL_HOURS * 60 * 60 * 1000)
      }
    });

    await recordAudit({ orgId: body.orgId, actorId: user.id, action: 'auth.register', targetType: 'user', targetId: user.id });
    await recordAudit({ orgId: body.orgId, actorId: user.id, action: 'auth.email_verification_issued', targetType: 'user', targetId: user.id });

    reply.code(201).send({ id: user.id, email: user.email, emailVerificationToken: verificationToken });
  });

  app.post('/auth/verify-email', { config: { rateLimit: { max: 20, timeWindow: '1 minute' } } }, async (request) => {
    const body = z.object({ orgId: z.string().cuid(), token: z.string().min(32) }).parse(request.body);
    const hashed = tokenHash(body.token);
    const verification = await prisma.emailVerificationToken.findUnique({ where: { tokenHash: hashed } });

    if (!verification || verification.orgId !== body.orgId || verification.consumedAt || verification.expiresAt < new Date()) {
      throw app.httpErrors.badRequest('Invalid verification token');
    }

    await prisma.$transaction([
      prisma.user.update({ where: { id: verification.userId }, data: { emailVerifiedAt: new Date() } }),
      prisma.emailVerificationToken.update({ where: { id: verification.id }, data: { consumedAt: new Date() } })
    ]);

    await recordAudit({ orgId: body.orgId, actorId: verification.userId, action: 'auth.email_verified', targetType: 'user', targetId: verification.userId });
    return { ok: true };
  });

  app.post('/auth/login', { config: { rateLimit: { max: 20, timeWindow: '1 minute' } } }, async (request, reply) => {
    const body = z.object({
      orgId: z.string().cuid(),
      email: z.string().email(),
      password: z.string(),
      totpCode: z.string().optional(),
      deviceId: z.string().min(6),
      fingerprint: z.string().min(6),
      os: z.string().min(1)
    }).parse(request.body);

    const user = await prisma.user.findUnique({ where: { orgId_email: { orgId: body.orgId, email: body.email } } });

    if (!user?.passwordHash) {
      throw app.httpErrors.unauthorized('Invalid credentials');
    }

    if (isUserLocked(user.lockedUntil)) {
      throw app.httpErrors.tooManyRequests('Account temporarily locked');
    }

    if (!(await argon2.verify(user.passwordHash, body.password))) {
      await registerFailedLogin(user.id);
      throw app.httpErrors.unauthorized('Invalid credentials');
    }

    await clearFailedLogins(user.id);

    if (user.mfaEnabled) {
      if (!body.totpCode || !user.mfaSecretEncrypted || !authenticator.verify({ token: body.totpCode, secret: user.mfaSecretEncrypted })) {
        throw app.httpErrors.unauthorized('MFA_REQUIRED');
      }
    }

    const refreshToken = randomBytes(32).toString('hex');
    const familyId = randomBytes(16).toString('hex');
    const session = await prisma.session.create({
      data: {
        orgId: body.orgId,
        userId: user.id,
        familyId,
        refreshTokenHash: hashToken(refreshToken),
        expiresAt: new Date(Date.now() + REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000),
        userAgent: request.headers['user-agent'],
        ipAddress: request.ip
      }
    });

    await prisma.device.upsert({
      where: { userId_deviceId: { userId: user.id, deviceId: body.deviceId } },
      create: {
        orgId: body.orgId,
        userId: user.id,
        deviceId: body.deviceId,
        fingerprint: body.fingerprint,
        os: body.os,
        trustLevel: 'known',
        lastSeenAt: new Date()
      },
      update: {
        fingerprint: body.fingerprint,
        os: body.os,
        lastSeenAt: new Date()
      }
    });

    const accessToken = await reply.jwtSign({ sub: user.id, orgId: body.orgId, sessionId: session.id }, { expiresIn: ACCESS_TTL_SECONDS });
    reply.setCookie('refresh_token', refreshToken, { httpOnly: true, sameSite: 'strict', secure: true, path: '/api/auth/refresh' });

    await recordAudit({ orgId: body.orgId, actorId: user.id, action: 'auth.login', targetType: 'session', targetId: session.id, ipAddress: request.ip });
    return { accessToken, sessionId: session.id, user: { id: user.id, email: user.email, name: user.name } };
  });

  app.post('/auth/refresh', { config: { rateLimit: { max: 30, timeWindow: '1 minute' } } }, async (request, reply) => {
    const refreshToken = request.cookies.refresh_token;
    const body = z.object({ sessionId: z.string().cuid() }).parse(request.body);
    if (!refreshToken) {
      throw app.httpErrors.unauthorized('Missing refresh token');
    }

    const nextRefreshToken = randomBytes(32).toString('hex');
    const nextSession = await rotateRefreshSession({
      sessionId: body.sessionId,
      presentedRefreshToken: refreshToken,
      nextRefreshToken,
      expiresAt: new Date(Date.now() + REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000)
    });

    const accessToken = await reply.jwtSign({ sub: nextSession.userId, orgId: nextSession.orgId, sessionId: nextSession.id }, { expiresIn: ACCESS_TTL_SECONDS });
    reply.setCookie('refresh_token', nextRefreshToken, { httpOnly: true, sameSite: 'strict', secure: true, path: '/api/auth/refresh' });

    await recordAudit({ orgId: nextSession.orgId, actorId: nextSession.userId, action: 'auth.refresh', targetType: 'session', targetId: nextSession.id, ipAddress: request.ip });
    return { accessToken, sessionId: nextSession.id };
  });

  app.post('/auth/logout', { preHandler: app.authenticate }, async (request, reply) => {
    const dal = orgDal(request.auth!.orgId);
    await dal.sessions.updateMany({ id: request.auth!.sessionId }, { status: 'REVOKED' });
    reply.clearCookie('refresh_token', { path: '/api/auth/refresh' });
    await recordAudit({ orgId: request.auth!.orgId, actorId: request.auth!.userId, action: 'auth.logout', targetType: 'session', targetId: request.auth!.sessionId });
    return { ok: true };
  });

  app.post('/auth/logout-all', { preHandler: app.authenticate }, async (request, reply) => {
    await prisma.session.updateMany({ where: { orgId: request.auth!.orgId, userId: request.auth!.userId }, data: { status: 'REVOKED' } });
    reply.clearCookie('refresh_token', { path: '/api/auth/refresh' });
    await recordAudit({ orgId: request.auth!.orgId, actorId: request.auth!.userId, action: 'auth.logout_all', targetType: 'user', targetId: request.auth!.userId });
    return { ok: true };
  });

  app.get('/auth/sessions', { preHandler: app.authenticate }, async (request) => {
    const [sessions, devices] = await Promise.all([
      prisma.session.findMany({ where: { orgId: request.auth!.orgId, userId: request.auth!.userId }, orderBy: { lastUsedAt: 'desc' } }),
      prisma.device.findMany({ where: { orgId: request.auth!.orgId, userId: request.auth!.userId }, orderBy: { lastSeenAt: 'desc' } })
    ]);
    return { sessions, devices };
  });

  app.post('/auth/password/forgot', { config: { rateLimit: { max: 5, timeWindow: '1 minute' } } }, async (request) => {
    const body = z.object({ orgId: z.string().cuid(), email: z.string().email() }).parse(request.body);
    const user = await prisma.user.findUnique({ where: { orgId_email: { orgId: body.orgId, email: body.email } } });

    if (!user) {
      return { ok: true };
    }

    const resetToken = randomBytes(32).toString('hex');
    await prisma.passwordResetToken.create({
      data: {
        orgId: body.orgId,
        userId: user.id,
        tokenHash: tokenHash(resetToken),
        expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60 * 1000)
      }
    });
    await recordAudit({ orgId: body.orgId, actorId: user.id, action: 'auth.password_reset_requested', targetType: 'user', targetId: user.id, ipAddress: request.ip });

    return { ok: true, passwordResetToken: resetToken };
  });

  app.post('/auth/password/reset', { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } }, async (request) => {
    const body = z.object({ orgId: z.string().cuid(), token: z.string().min(32), newPassword: z.string().min(12) }).parse(request.body);
    const hashed = tokenHash(body.token);
    const reset = await prisma.passwordResetToken.findUnique({ where: { tokenHash: hashed } });

    if (!reset || reset.orgId !== body.orgId || reset.consumedAt || reset.expiresAt < new Date()) {
      throw app.httpErrors.badRequest('Invalid reset token');
    }

    const nextPasswordHash = await argon2.hash(body.newPassword, { type: argon2.argon2id });

    await prisma.$transaction([
      prisma.user.update({ where: { id: reset.userId }, data: { passwordHash: nextPasswordHash, failedLoginAttempts: 0, lockedUntil: null } }),
      prisma.passwordResetToken.update({ where: { id: reset.id }, data: { consumedAt: new Date() } }),
      prisma.session.updateMany({ where: { orgId: body.orgId, userId: reset.userId }, data: { status: 'REVOKED' } })
    ]);

    await recordAudit({ orgId: body.orgId, actorId: reset.userId, action: 'auth.password_changed', targetType: 'user', targetId: reset.userId, ipAddress: request.ip });
    return { ok: true };
  });

  app.post('/auth/mfa/setup', { preHandler: app.authenticate }, async (request) => {
    const secret = authenticator.generateSecret();
    await prisma.user.update({ where: { id: request.auth!.userId }, data: { mfaSecretEncrypted: secret } });
    const otpAuthUrl = authenticator.keyuri(request.auth!.userId, 'EnterpriseChat', secret);
    return { secret, otpAuthUrl };
  });

  app.post('/auth/mfa/enable', { preHandler: app.authenticate }, async (request) => {
    const body = z.object({ code: z.string().length(6) }).parse(request.body);
    const user = await prisma.user.findUniqueOrThrow({ where: { id: request.auth!.userId } });
    if (!user.mfaSecretEncrypted || !authenticator.verify({ token: body.code, secret: user.mfaSecretEncrypted })) {
      throw app.httpErrors.badRequest('Invalid TOTP code');
    }
    const backupCodes = Array.from({ length: 8 }, () => randomBytes(4).toString('hex'));
    await prisma.user.update({
      where: { id: request.auth!.userId },
      data: { mfaEnabled: true, backupCodesHash: await Promise.all(backupCodes.map((code) => argon2.hash(code))) }
    });
    return { backupCodes };
  });
};
