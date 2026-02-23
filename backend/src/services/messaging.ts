export type MessageCursor = {
  createdAt: string;
  id: string;
};

export function parseMentions(input: string) {
  const matches = input.match(/@[a-zA-Z0-9._-]+/g) ?? [];
  return [...new Set(matches.map((m) => m.slice(1).toLowerCase()))];
}

export function encodeCursor(cursor: MessageCursor) {
  return Buffer.from(JSON.stringify(cursor), 'utf8').toString('base64url');
}

export function decodeCursor(cursor?: string): MessageCursor | null {
  if (!cursor) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
    if (!parsed?.createdAt || !parsed?.id) {
      return null;
    }
    return { createdAt: parsed.createdAt, id: parsed.id };
  } catch {
    return null;
  }
}
