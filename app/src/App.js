import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './styles/app.css';
import { AppProvider, useAppContext } from './context/AppContext';
import Login from './Login';
import Register from './Register';
import Navigation from './Navigation';
import HomePage from './pages/home';
import ExplorePage from './pages/explore';
import CreatePage from './pages/create';
import ProfilePage from './pages/profile';
import MessagesPage from './pages/messages';
import ActivityPage from './pages/activity';
import WebViewPage from './pages/webview';
import VeemePage from './pages/veeme';

/**
 * Protected Route Component
 */
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAppContext();
  return isAuthenticated ? children : <Navigate to="/login" />;
};

/**
 * Main App Component
 */
const AppContent = () => {
  const { isAuthenticated, currentUser, logout } = useAppContext();

  if (!isAuthenticated) {
    return (
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    );
  }

  return (
    <Router>
      <div className="app-container">
        <Navigation currentUser={currentUser} onLogout={logout} />
        <main className="main-content">
          <Routes>
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <HomePage currentUser={currentUser} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/explore"
              element={
                <ProtectedRoute>
                  <ExplorePage currentUser={currentUser} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/create"
              element={
                <ProtectedRoute>
                  <CreatePage currentUser={currentUser} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile/:userId"
              element={
                <ProtectedRoute>
                  <ProfilePage currentUser={currentUser} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/messages"
              element={
                <ProtectedRoute>
                  <MessagesPage currentUser={currentUser} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/activity"
              element={
                <ProtectedRoute>
                  <ActivityPage currentUser={currentUser} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/veeme"
              element={
                <ProtectedRoute>
                  <VeemePage currentUser={currentUser} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/webview"
              element={
                <ProtectedRoute>
                  <WebViewPage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

/**
 * Root App Component
 */
function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
