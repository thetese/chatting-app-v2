/**
 * Story Entity
 * Represents a temporary story (like Instagram stories)
 */
class Story {
  constructor(data = {}) {
    this.id = data.id || null;
    this.userId = data.userId || null;
    this.author = data.author || null;
    this.content = data.content || '';
    this.media = data.media || []; // Images or videos
    this.mediaType = data.mediaType || 'image'; // image or video
    this.views = data.views || [];
    this.viewCount = data.viewCount || 0;
    this.createdAt = data.createdAt || new Date();
    this.expiresAt = data.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    this.isArchived = data.isArchived || false;
    this.allowComments = data.allowComments !== false;
    this.visibility = data.visibility || 'public'; // public, friends, private
  }

  validate() {
    const errors = [];
    if (!this.media || this.media.length === 0) {
      errors.push('Story must have media content');
    }
    if (!['image', 'video'].includes(this.mediaType)) {
      errors.push('Media type must be image or video');
    }
    return errors;
  }

  isExpired() {
    return new Date() > this.expiresAt;
  }

  addView(userId) {
    if (!this.views.includes(userId)) {
      this.views.push(userId);
      this.viewCount++;
    }
  }
}

export default Story;
