import React from 'react';
import '../styles/story.css';

/**
 * Story Component
 * Displays a single story in the carousel
 */
const Story = ({ story, currentUser, onClick }) => {
  return (
    <div className="story-item" onClick={onClick}>
      <div className="story-container">
        <img src={story.media[0]} alt="story" className="story-image" />
        <div className="story-user-info">
          <img
            src={story.author?.profileImage || '/default-avatar.png'}
            alt={story.author?.username}
            className="story-avatar"
          />
          <span>{story.author?.username}</span>
        </div>
        <div className="story-overlay">
          <div className="story-progress-bar" />
        </div>
      </div>
    </div>
  );
};

export default Story;
