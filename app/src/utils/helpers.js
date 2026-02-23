/**
 * Utility functions
 * General helper functions for the application
 */

/**
 * Format timestamp to readable date string
 */
export const formatDate = (date) => {
  const d = new Date(date);
  const now = new Date();
  const diff = now - d;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return d.toLocaleDateString();
};

/**
 * Format number with suffix (1K, 1M, etc.)
 */
export const formatNumber = (num) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

/**
 * Extract hashtags from text
 */
export const extractHashtags = (text) => {
  const regex = /#(\w+)/g;
  const matches = text.match(regex) || [];
  return matches.map(tag => tag.substring(1));
};

/**
 * Extract mentions from text
 */
export const extractMentions = (text) => {
  const regex = /@(\w+)/g;
  const matches = text.match(regex) || [];
  return matches.map(mention => mention.substring(1));
};

/**
 * Highlight hashtags and mentions in text
 */
export const highlightHashtagsAndMentions = (text) => {
  return text
    .replace(/#(\w+)/g, '<a href="/hashtag/$1">#$1</a>')
    .replace(/@(\w+)/g, '<a href="/profile/$1">@$1</a>');
};

/**
 * Truncate text to specified length
 */
export const truncateText = (text, length = 100) => {
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
};

/**
 * Validate URL
 */
export const isValidUrl = (string) => {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
};

/**
 * Get file size in human readable format
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Check if object is empty
 */
export const isEmpty = (obj) => {
  return Object.keys(obj).length === 0;
};

/**
 * Deep copy object
 */
export const deepCopy = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Debounce function
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Throttle function
 */
export const throttle = (func, limit) => {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * Generate unique ID
 */
export const generateId = () => {
  return Math.random().toString(36).substr(2, 9);
};

/**
 * Get initials from name
 */
export const getInitials = (fullName) => {
  return fullName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase();
};
