import { describe, expect, it } from 'vitest';
import { appendRealtimeEvent, getEventsAfterSequence, getLatestSequence } from '../src/services/realtimeEvents';

describe('realtime event sequencing', () => {
  it('increments server sequence numbers per org', () => {
    const e1 = appendRealtimeEvent('org-seq', 'message.created', { id: 'm1' });
    const e2 = appendRealtimeEvent('org-seq', 'message.updated', { id: 'm1' });

    expect(e2.seq).toBe(e1.seq + 1);
    expect(getLatestSequence('org-seq')).toBe(e2.seq);
  });

  it('returns only missed events after a sequence cursor', () => {
    const first = appendRealtimeEvent('org-resync', 'presence.updated', { userId: 'u1' });
    const second = appendRealtimeEvent('org-resync', 'typing.started', { userId: 'u1', conversationId: 'c1' });
    const missed = getEventsAfterSequence('org-resync', first.seq);

    expect(missed.length).toBeGreaterThanOrEqual(1);
    expect(missed[0].seq).toBe(second.seq);
  });
});
