/**
 * Like Entity
 * Represents a like on a post or comment
 */
class Like {
  constructor(data = {}) {
    this.id = data.id || null;
    this.userId = data.userId || null;
    this.targetId = data.targetId || null; // Post or Comment ID
    this.targetType = data.targetType || 'post'; // 'post' or 'comment'
    this.createdAt = data.createdAt || new Date();
  }

  validate() {
    const errors = [];
    if (!this.userId) {
      errors.push('User ID is required');
    }
    if (!this.targetId) {
      errors.push('Target ID is required');
    }
    if (!['post', 'comment'].includes(this.targetType)) {
      errors.push('Target type must be post or comment');
    }
    return errors;
  }
}

export default Like;
