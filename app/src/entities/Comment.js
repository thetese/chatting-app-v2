/**
 * Comment Entity
 * Represents a comment on a post
 */
class Comment {
  constructor(data = {}) {
    this.id = data.id || null;
    this.postId = data.postId || null;
    this.userId = data.userId || null;
    this.author = data.author || null;
    this.content = data.content || '';
    this.likes = data.likes || [];
    this.likeCount = data.likeCount || 0;
    this.replies = data.replies || [];
    this.replyCount = data.replyCount || 0;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    this.deletedAt = data.deletedAt || null;
    this.isEdited = data.isEdited || false;
  }

  validate() {
    const errors = [];
    if (!this.content || this.content.trim().length === 0) {
      errors.push('Comment cannot be empty');
    }
    if (this.content && this.content.length > 1000) {
      errors.push('Comment cannot exceed 1000 characters');
    }
    return errors;
  }

  addLike(userId) {
    if (!this.likes.includes(userId)) {
      this.likes.push(userId);
      this.likeCount++;
    }
  }

  removeLike(userId) {
    const index = this.likes.indexOf(userId);
    if (index > -1) {
      this.likes.splice(index, 1);
      this.likeCount--;
    }
  }

  addReply(reply) {
    this.replies.push(reply);
    this.replyCount++;
  }
}

export default Comment;
