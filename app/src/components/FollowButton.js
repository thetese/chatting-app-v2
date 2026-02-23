import React, { useState } from 'react';
import '../styles/followbutton.css';

/**
 * FollowButton Component
 * Reusable button for following/unfollowing users
 */
const FollowButton = ({ userId, currentUser, isFollowing: initialFollowing, onFollowChange }) => {
  const [isFollowing, setIsFollowing] = useState(initialFollowing);
  const [isLoading, setIsLoading] = useState(false);

  const handleFollowClick = async () => {
    try {
      setIsLoading(true);
      const newFollowingState = !isFollowing;

      // API call would go here
      // await fetch(`/api/users/${userId}/follow`, {
      //   method: newFollowingState ? 'POST' : 'DELETE'
      // });

      setIsFollowing(newFollowingState);
      if (onFollowChange) {
        onFollowChange(newFollowingState);
      }
    } catch (err) {
      console.error('Failed to update follow status:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      className={`follow-btn ${isFollowing ? 'following' : ''}`}
      onClick={handleFollowClick}
      disabled={isLoading}
    >
      {isLoading ? 'Loading...' : isFollowing ? 'Following' : 'Follow'}
    </button>
  );
};

export default FollowButton;
