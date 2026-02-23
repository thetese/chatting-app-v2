/**
 * Follow Entity
 * Represents a follow relationship between users
 */
class Follow {
  constructor(data = {}) {
    this.id = data.id || null;
    this.followerId = data.followerId || null;
    this.followingId = data.followingId || null;
    this.status = data.status || 'active'; // active, pending, blocked
    this.createdAt = data.createdAt || new Date();
  }

  validate() {
    const errors = [];
    if (!this.followerId) {
      errors.push('Follower ID is required');
    }
    if (!this.followingId) {
      errors.push('Following ID is required');
    }
    if (this.followerId === this.followingId) {
      errors.push('Cannot follow yourself');
    }
    if (!['active', 'pending', 'blocked'].includes(this.status)) {
      errors.push('Invalid follow status');
    }
    return errors;
  }
}

export default Follow;
