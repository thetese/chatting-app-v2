/**
 * API Service
 * Handles all API calls to the backend
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

class ApiService {
  static async request(endpoint, options = {}) {
    const token = localStorage.getItem('authToken');
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
      ...(token && { Authorization: `Bearer ${token}` })
    };

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Auth endpoints
  static register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  static login(email, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  }

  static logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  }

  static getCurrentUser() {
    return this.request('/auth/me');
  }

  // User endpoints
  static getUser(userId) {
    return this.request(`/users/${userId}`);
  }

  static updateProfile(userId, userData) {
    return this.request(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
  }

  static followUser(userId) {
    return this.request(`/users/${userId}/follow`, { method: 'POST' });
  }

  static unfollowUser(userId) {
    return this.request(`/users/${userId}/follow`, { method: 'DELETE' });
  }

  static getFollowers(userId) {
    return this.request(`/users/${userId}/followers`);
  }

  static getFollowing(userId) {
    return this.request(`/users/${userId}/following`);
  }

  // Post endpoints
  static getFeed(options = {}) {
    const params = new URLSearchParams(options);
    return this.request(`/posts/feed?${params}`);
  }

  static getPost(postId) {
    return this.request(`/posts/${postId}`);
  }

  static createPost(postData) {
    return this.request('/posts', {
      method: 'POST',
      body: JSON.stringify(postData)
    });
  }

  static updatePost(postId, postData) {
    return this.request(`/posts/${postId}`, {
      method: 'PUT',
      body: JSON.stringify(postData)
    });
  }

  static deletePost(postId) {
    return this.request(`/posts/${postId}`, { method: 'DELETE' });
  }

  static getUserPosts(userId) {
    return this.request(`/users/${userId}/posts`);
  }

  // Like endpoints
  static likePost(postId) {
    return this.request(`/posts/${postId}/likes`, { method: 'POST' });
  }

  static unlikePost(postId) {
    return this.request(`/posts/${postId}/likes`, { method: 'DELETE' });
  }

  // Comment endpoints
  static getComments(postId) {
    return this.request(`/posts/${postId}/comments`);
  }

  static addComment(postId, content) {
    return this.request(`/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content })
    });
  }

  static deleteComment(commentId) {
    return this.request(`/comments/${commentId}`, { method: 'DELETE' });
  }

  // Message endpoints
  static getConversations() {
    return this.request('/messages/conversations');
  }

  static getMessages(conversationId) {
    return this.request(`/messages/conversations/${conversationId}`);
  }

  static sendMessage(conversationId, content) {
    return this.request(`/messages/conversations/${conversationId}`, {
      method: 'POST',
      body: JSON.stringify({ content })
    });
  }

  // Notification endpoints
  static getNotifications() {
    return this.request('/notifications');
  }

  static markNotificationAsRead(notificationId) {
    return this.request(`/notifications/${notificationId}/read`, {
      method: 'PATCH'
    });
  }

  // Search endpoints
  static search(query, type = 'all') {
    const params = new URLSearchParams({ q: query, type });
    return this.request(`/search?${params}`);
  }

  static getTrending() {
    return this.request('/trending');
  }

  // Story endpoints
  static getStories() {
    return this.request('/stories');
  }

  static createStory(storyData) {
    return this.request('/stories', {
      method: 'POST',
      body: JSON.stringify(storyData)
    });
  }

  static viewStory(storyId) {
    return this.request(`/stories/${storyId}/view`, { method: 'POST' });
  }
}

export default ApiService;
