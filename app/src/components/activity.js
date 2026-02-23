import React, { useState, useEffect } from 'react';
import '../styles/activity.css';

/**
 * Activity Component
 * Shows notifications and activity feed
 */
const Activity = ({ currentUser }) => {
  const [notifications, setNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState('all'); // all, likes, comments, follows
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, [currentUser]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      // API call would go here
      // const response = await fetch(`/api/notifications?userId=${currentUser.id}`);
      // const data = await response.json();
      setNotifications([]);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      // API call would go here
      // await fetch(`/api/notifications/${notificationId}/read`, { method: 'PATCH' });
      
      setNotifications(notifications.map(n =>
        n.id === notificationId ? { ...n, isRead: true } : n
      ));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'all') return true;
    return n.type === activeTab;
  });

  return (
    <div className="activity-container">
      <div className="activity-header">
        <h2>Activity</h2>
      </div>

      <div className="activity-tabs">
        {['all', 'likes', 'comments', 'follows'].map(tab => (
          <button
            key={tab}
            className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className="notifications-list">
        {loading && <div className="loading">Loading notifications...</div>}

        {!loading && filteredNotifications.length === 0 && (
          <div className="empty-state">
            <p>No notifications yet</p>
          </div>
        )}

        {filteredNotifications.map(notification => (
          <div
            key={notification.id}
            className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
            onClick={() => markAsRead(notification.id)}
          >
            <img
              src={notification.actor?.profileImage || '/default-avatar.png'}
              alt={notification.actor?.username}
              className="notification-avatar"
            />
            
            <div className="notification-content">
              <p>
                <strong>{notification.actor?.username}</strong>
                {' '}
                {notification.type === 'like' && 'liked your post'}
                {notification.type === 'comment' && 'commented on your post'}
                {notification.type === 'follow' && 'started following you'}
                {notification.type === 'mention' && 'mentioned you'}
              </p>
              <span className="notification-time">
                {new Date(notification.createdAt).toLocaleDateString()}
              </span>
            </div>

            {notification.actionUrl && (
              <a href={notification.actionUrl} className="notification-action">
                →
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Activity;
