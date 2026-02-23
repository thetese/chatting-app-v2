import { Message } from '@prisma/client';

export type ExportScope = {
  conversationIds?: string[];
  userIds?: string[];
  from?: Date;
  to?: Date;
};

export function canIncludeContent(complianceSettings: unknown): boolean {
  if (!complianceSettings || typeof complianceSettings !== 'object') {
    return true;
  }

  const settings = complianceSettings as Record<string, unknown>;
  if (typeof settings.allowContentExport === 'boolean') {
    return settings.allowContentExport;
  }

  return true;
}

export function applyMessageExportPolicy(messages: Message[], includeContent: boolean) {
  return messages.map((message) => ({
    id: message.id,
    conversationId: message.conversationId,
    senderId: message.senderId,
    createdAt: message.createdAt,
    editedAt: message.editedAt,
    isDeleted: message.isDeleted,
    body: includeContent ? message.body : null,
    markdownBody: includeContent ? message.markdownBody : null,
    replyToMessageId: message.replyToMessageId
  }));
}
