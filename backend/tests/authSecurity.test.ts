import { describe, expect, it } from 'vitest';
import { isUserLocked, LOCKOUT_MINUTES, MAX_FAILED_LOGIN_ATTEMPTS } from '../src/services/authSecurity';

describe('auth security policies', () => {
  it('exposes lockout policy thresholds', () => {
    expect(MAX_FAILED_LOGIN_ATTEMPTS).toBe(5);
    expect(LOCKOUT_MINUTES).toBe(15);
  });

  it('detects lockout windows correctly', () => {
    expect(isUserLocked(new Date(Date.now() + 60_000))).toBe(true);
    expect(isUserLocked(new Date(Date.now() - 60_000))).toBe(false);
    expect(isUserLocked(null)).toBe(false);
  });
});
