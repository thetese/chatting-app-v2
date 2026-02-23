/**
 * Notification Entity
 * Represents a notification for user activity
 */
class Notification {
  constructor(data = {}) {
    this.id = data.id || null;
    this.userId = data.userId || null;
    this.type = data.type || 'like'; // like, comment, follow, message, mention
    this.actor = data.actor || null; // User who triggered notification
    this.targetId = data.targetId || null; // Post, Comment, or User ID
    this.targetType = data.targetType || 'post'; // post, comment, user, message
    this.message = data.message || '';
    this.isRead = data.isRead || false;
    this.readAt = data.readAt || null;
    this.createdAt = data.createdAt || new Date();
    this.actionUrl = data.actionUrl || null;
  }

  validate() {
    const errors = [];
    if (!this.userId) {
      errors.push('User ID is required');
    }
    const validTypes = ['like', 'comment', 'follow', 'message', 'mention'];
    if (!validTypes.includes(this.type)) {
      errors.push('Invalid notification type');
    }
    return errors;
  }

  markAsRead() {
    this.isRead = true;
    this.readAt = new Date();
  }
}

export default Notification;
