/**
 * User Entity
 * Represents a user in the application
 */
class User {
  constructor(data = {}) {
    this.id = data.id || null;
    this.username = data.username || '';
    this.email = data.email || '';
    this.password = data.password || ''; // hashed in production
    this.fullName = data.fullName || '';
    this.bio = data.bio || '';
    this.profileImage = data.profileImage || null;
    this.coverImage = data.coverImage || null;
    this.website = data.website || '';
    this.location = data.location || '';
    this.birthDate = data.birthDate || null;
    this.isVerified = data.isVerified || false;
    this.isPrivate = data.isPrivate || false;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    this.followerCount = data.followerCount || 0;
    this.followingCount = data.followingCount || 0;
    this.postCount = data.postCount || 0;
  }

  validate() {
    const errors = [];
    if (!this.username || this.username.length < 3) {
      errors.push('Username must be at least 3 characters');
    }
    if (!this.email || !this.email.includes('@')) {
      errors.push('Valid email is required');
    }
    if (!this.password || this.password.length < 6) {
      errors.push('Password must be at least 6 characters');
    }
    return errors;
  }

  toJSON() {
    const { password, ...userWithoutPassword } = this;
    return userWithoutPassword;
  }
}

export default User;
