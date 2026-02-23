/**
 * Context for Global State Management
 */

import React, { createContext, useState, useCallback } from 'react';
import AuthService from '../utils/auth';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(AuthService.getCurrentUser());
  const [isAuthenticated, setIsAuthenticated] = useState(AuthService.isAuthenticated());
  const [notifications, setNotifications] = useState([]);
  const [theme, setTheme] = useState('light');
  const [loading, setLoading] = useState(false);

  const login = useCallback(async (email, password) => {
    try {
      setLoading(true);
      const response = await AuthService.login(email, password);
      setCurrentUser(response.user);
      setIsAuthenticated(true);
      return response;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (userData) => {
    try {
      setLoading(true);
      const response = await AuthService.register(
        userData.username,
        userData.email,
        userData.password,
        userData.fullName
      );
      setCurrentUser(response.user);
      setIsAuthenticated(true);
      return response;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    AuthService.logout();
    setCurrentUser(null);
    setIsAuthenticated(false);
    setNotifications([]);
  }, []);

  const demoLogin = useCallback(() => {
    const mockUser = {
      id: 'demo-user-1',
      username: 'demo',
      email: 'demo@socialhub.app',
      fullName: 'Demo User',
      profileImage: '/default-avatar.png'
    };
    localStorage.setItem('authToken', 'demo-token');
    localStorage.setItem('user', JSON.stringify(mockUser));
    setCurrentUser(mockUser);
    setIsAuthenticated(true);
  }, []);

  const updateUser = useCallback((userData) => {
    setCurrentUser(userData);
  }, []);

  const addNotification = useCallback((notification) => {
    setNotifications(prev => [...prev, notification]);
  }, []);

  const removeNotification = useCallback((notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  }, []);

  const value = {
    currentUser,
    isAuthenticated,
    notifications,
    theme,
    loading,
    login,
    register,
    logout,
    demoLogin,
    updateUser,
    addNotification,
    removeNotification,
    setTheme
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = React.useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};
