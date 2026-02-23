import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import './styles/navigation.css';
import {
  HomeIcon,
  ExploreIcon,
  CreateIcon,
  MessagesIcon,
  ActivityIcon,
  WebIcon,
  VeemeIcon,
  ProfileIcon
} from './components/NavIcons';

/**
 * Navigation Component
 * Main navigation sidebar
 */
const Navigation = ({ currentUser, onLogout }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      onLogout();
    }
  };

  const navItems = [
    { path: '/', label: 'Home', Icon: HomeIcon },
    { path: '/explore', label: 'Explore', Icon: ExploreIcon },
    { path: '/create', label: 'Create', Icon: CreateIcon },
    { path: '/messages', label: 'Messages', Icon: MessagesIcon },
    { path: '/activity', label: 'Activity', Icon: ActivityIcon },
    { path: '/veeme', label: 'Veeme', Icon: VeemeIcon },
    { path: '/webview', label: 'Web', Icon: WebIcon },
    { path: `/profile/${currentUser?.id}`, label: 'Profile', Icon: ProfileIcon }
  ];

  return (
    <nav className="navigation">
      <div className="nav-container">
        {/* Logo */}
        <div className="nav-logo">
          <h2>SocialHub</h2>
        </div>

        {/* Mobile Toggle */}
        <button
          className="mobile-toggle"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
        >
          ☰
        </button>

        {/* Nav Items */}
        <div className={`nav-items ${isMobileOpen ? 'mobile-open' : ''}`}>
          {navItems.map(item => {
            const Icon = item.Icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setIsMobileOpen(false)}
                end={item.path === '/'}
              >
                <span className="nav-icon"><Icon /></span>
                <span className="nav-label">{item.label}</span>
              </NavLink>
            );
          })}
        </div>

        {/* User Menu */}
        <div className="nav-user">
          <img
            src={currentUser?.profileImage || '/default-avatar.png'}
            alt={currentUser?.username}
            className="nav-user-avatar"
            title={currentUser?.fullName}
          />
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
