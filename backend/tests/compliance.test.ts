import { describe, expect, it } from 'vitest';
import { applyMessageExportPolicy, canIncludeContent } from '../src/services/compliance';

describe('compliance export policy', () => {
  it('defaults to content allowed when setting missing', () => {
    expect(canIncludeContent(undefined)).toBe(true);
  });

  it('honors allowContentExport false', () => {
    expect(canIncludeContent({ allowContentExport: false })).toBe(false);
  });

  it('redacts content when content export is disabled', () => {
    const rows: any[] = [{
      id: 'm1',
      conversationId: 'c1',
      senderId: 'u1',
      createdAt: new Date(),
      editedAt: null,
      isDeleted: false,
      body: 'secret',
      markdownBody: 'secret',
      replyToMessageId: null
    }];

    const exported = applyMessageExportPolicy(rows as any, false);
    expect(exported[0].body).toBeNull();
    expect(exported[0].markdownBody).toBeNull();
  });
});
