import { prisma } from '../lib/prisma';

const MAX_FAILED_LOGIN_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

export function isUserLocked(lockedUntil?: Date | null) {
  return Boolean(lockedUntil && lockedUntil.getTime() > Date.now());
}

export async function registerFailedLogin(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const attempts = user.failedLoginAttempts + 1;
  const shouldLock = attempts >= MAX_FAILED_LOGIN_ATTEMPTS;

  await prisma.user.update({
    where: { id: userId },
    data: {
      failedLoginAttempts: shouldLock ? 0 : attempts,
      lockedUntil: shouldLock ? new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000) : user.lockedUntil
    }
  });

  return { attempts, locked: shouldLock };
}

export async function clearFailedLogins(userId: string) {
  await prisma.user.update({ where: { id: userId }, data: { failedLoginAttempts: 0, lockedUntil: null } });
}

export { MAX_FAILED_LOGIN_ATTEMPTS, LOCKOUT_MINUTES };
