import { describe, it, expect } from 'vitest';
import { hashToken } from '../src/services/session';

describe('session token hashing', () => {
  it('is deterministic', () => {
    expect(hashToken('abc')).toEqual(hashToken('abc'));
  });

  it('changes with token value', () => {
    expect(hashToken('abc')).not.toEqual(hashToken('abcd'));
  });
});
