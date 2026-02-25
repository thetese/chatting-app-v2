import { describe, expect, it } from 'vitest';
import { decodeCursor, encodeCursor, parseMentions } from '../src/services/messaging';

describe('messaging utilities', () => {
  it('parses unique mentions from message content', () => {
    expect(parseMentions('hi @Alice and @bob and @alice')).toEqual(['alice', 'bob']);
  });

  it('encodes and decodes cursors', () => {
    const cursor = { createdAt: new Date('2025-01-01T00:00:00.000Z').toISOString(), id: 'msg_1' };
    const encoded = encodeCursor(cursor);
    expect(decodeCursor(encoded)).toEqual(cursor);
  });

  it('returns null for invalid cursor input', () => {
    expect(decodeCursor('bad-cursor')).toBeNull();
  });
});
