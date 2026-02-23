/**
 * Authentication Service
 * Handles user authentication and session management
 */

import ApiService from './api';

class AuthService {
  static async register(username, email, password, fullName) {
    try {
      const response = await ApiService.register({
        username,
        email,
        password,
        fullName
      });

      if (response.token) {
        localStorage.setItem('authToken', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
      }

      return response;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  }

  static async login(email, password) {
    try {
      const response = await ApiService.login(email, password);

      if (response.token) {
        localStorage.setItem('authToken', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
      }

      return response;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  static logout() {
    ApiService.logout();
  }

  static getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  static isAuthenticated() {
    return !!localStorage.getItem('authToken');
  }

  static getToken() {
    return localStorage.getItem('authToken');
  }

  static async refreshToken() {
    try {
      const response = await ApiService.request('/auth/refresh', {
        method: 'POST'
      });

      if (response.token) {
        localStorage.setItem('authToken', response.token);
      }

      return response.token;
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.logout();
      throw error;
    }
  }

  static validatePassword(password) {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special char
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(password);
  }

  static validateEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  static validateUsername(username) {
    // 3-20 characters, alphanumeric and underscore only
    const regex = /^[a-zA-Z0-9_]{3,20}$/;
    return regex.test(username);
  }
}

export default AuthService;
