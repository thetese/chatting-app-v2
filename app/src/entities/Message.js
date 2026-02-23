/**
 * Message Entity
 * Represents a direct message between users
 */
class Message {
  constructor(data = {}) {
    this.id = data.id || null;
    this.conversationId = data.conversationId || null;
    this.senderId = data.senderId || null;
    this.receiverId = data.receiverId || null;
    this.content = data.content || '';
    this.attachments = data.attachments || [];
    this.isRead = data.isRead || false;
    this.readAt = data.readAt || null;
    this.createdAt = data.createdAt || new Date();
    this.deletedAt = data.deletedAt || null;
  }

  validate() {
    const errors = [];
    if (!this.senderId) {
      errors.push('Sender ID is required');
    }
    if (!this.receiverId) {
      errors.push('Receiver ID is required');
    }
    if (!this.content && !this.attachments?.length) {
      errors.push('Message must have content or attachments');
    }
    if (this.senderId === this.receiverId) {
      errors.push('Cannot send message to yourself');
    }
    return errors;
  }

  markAsRead() {
    this.isRead = true;
    this.readAt = new Date();
  }
}

export default Message;
