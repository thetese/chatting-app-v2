export type RealtimeEnvelope<T = Record<string, unknown>> = {
  seq: number;
  orgId: string;
  type: string;
  payload: T;
  createdAt: string;
};

const MAX_EVENTS_PER_ORG = 5000;

const sequenceByOrg = new Map<string, number>();
const eventLogByOrg = new Map<string, RealtimeEnvelope[]>();

export function appendRealtimeEvent<T extends Record<string, unknown>>(orgId: string, type: string, payload: T) {
  const nextSeq = (sequenceByOrg.get(orgId) ?? 0) + 1;
  sequenceByOrg.set(orgId, nextSeq);

  const envelope: RealtimeEnvelope<T> = {
    seq: nextSeq,
    orgId,
    type,
    payload,
    createdAt: new Date().toISOString()
  };

  const list = eventLogByOrg.get(orgId) ?? [];
  list.push(envelope);
  if (list.length > MAX_EVENTS_PER_ORG) {
    list.splice(0, list.length - MAX_EVENTS_PER_ORG);
  }
  eventLogByOrg.set(orgId, list);

  return envelope;
}

export function getEventsAfterSequence(orgId: string, lastSeq: number, limit = 500) {
  const list = eventLogByOrg.get(orgId) ?? [];
  return list.filter((event) => event.seq > lastSeq).slice(0, limit);
}

export function getLatestSequence(orgId: string) {
  return sequenceByOrg.get(orgId) ?? 0;
}
