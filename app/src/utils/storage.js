/**
 * Local Storage Manager
 * Handles all local storage operations
 */

class StorageManager {
  static set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Failed to save to local storage:', error);
      return false;
    }
  }

  static get(key) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Failed to retrieve from local storage:', error);
      return null;
    }
  }

  static remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Failed to remove from local storage:', error);
      return false;
    }
  }

  static clear() {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Failed to clear local storage:', error);
      return false;
    }
  }

  static setUser(user) {
    return this.set('user', user);
  }

  static getUser() {
    return this.get('user');
  }

  static setToken(token) {
    return this.set('authToken', token);
  }

  static getToken() {
    return this.get('authToken');
  }

  static setTheme(theme) {
    return this.set('theme', theme);
  }

  static getTheme() {
    return this.get('theme') || 'light';
  }

  static setSavedDrafts(drafts) {
    return this.set('drafts', drafts);
  }

  static getSavedDrafts() {
    return this.get('drafts') || [];
  }

  static setUserPreferences(preferences) {
    return this.set('preferences', preferences);
  }

  static getUserPreferences() {
    return this.get('preferences') || {};
  }
}

export default StorageManager;
