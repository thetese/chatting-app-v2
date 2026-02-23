/**
 * Post Entity
 * Represents a user post/content
 */
class Post {
  constructor(data = {}) {
    this.id = data.id || null;
    this.userId = data.userId || null;
    this.author = data.author || null;
    this.content = data.content || '';
    this.images = data.images || [];
    this.videos = data.videos || [];
    this.likes = data.likes || [];
    this.likeCount = data.likeCount || 0;
    this.comments = data.comments || [];
    this.commentCount = data.commentCount || 0;
    this.shares = data.shares || 0;
    this.visibility = data.visibility || 'public'; // public, friends, private
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    this.deletedAt = data.deletedAt || null;
    this.isEdited = data.isEdited || false;
    this.hashtags = data.hashtags || [];
    this.mentions = data.mentions || [];
  }

  validate() {
    const errors = [];
    if (!this.content || this.content.trim().length === 0) {
      if (!this.images?.length && !this.videos?.length) {
        errors.push('Post must have content or media');
      }
    }
    if (this.content && this.content.length > 5000) {
      errors.push('Post content cannot exceed 5000 characters');
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

  addComment(comment) {
    this.comments.push(comment);
    this.commentCount++;
  }

  removeComment(commentId) {
    this.comments = this.comments.filter(c => c.id !== commentId);
    this.commentCount--;
  }
}

export default Post;
