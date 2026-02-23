import React, { useState, useEffect } from 'react';
import '../styles/profile.css';
import PostCard from './PostCard';
import FollowButton from './FollowButton';

/**
 * Profile Component
 * Displays user profile with posts, followers, and information
 */
const Profile = ({ userId, currentUser }) => {
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState('posts'); // posts, media, likes
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      // API call would go here
      // const response = await fetch(`/api/users/${userId}`);
      // const user = await response.json();
      setProfile(null);
      setPosts([]);
      setError(null);
    } catch (err) {
      setError('Failed to load profile');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowChange = (newFollowingState) => {
    setIsFollowing(newFollowingState);
    if (profile) {
      setProfile({
        ...profile,
        followerCount: profile.followerCount + (newFollowingState ? 1 : -1)
      });
    }
  };

  if (loading) {
    return <div className="profile-container"><div className="loading">Loading profile...</div></div>;
  }

  if (error || !profile) {
    return <div className="profile-container"><div className="error-message">{error || 'User not found'}</div></div>;
  }

  const isOwnProfile = currentUser?.id === profile.id;

  return (
    <div className="profile-container">
      {/* Header */}
      <div className="profile-header">
        {profile.coverImage && (
          <img src={profile.coverImage} alt="Cover" className="cover-image" />
        )}
        
        <div className="profile-info">
          <div className="profile-top">
            <img
              src={profile.profileImage || '/default-avatar.png'}
              alt={profile.username}
              className="profile-avatar"
            />
            
            <div className="profile-details">
              <h1>{profile.fullName}</h1>
              <p className="username">@{profile.username}</p>
              {profile.isVerified && <span className="verified">✓ Verified</span>}
            </div>

            {!isOwnProfile && (
              <FollowButton
                userId={profile.id}
                currentUser={currentUser}
                isFollowing={isFollowing}
                onFollowChange={handleFollowChange}
              />
            )}
          </div>

          {profile.bio && <p className="bio">{profile.bio}</p>}

          <div className="profile-meta">
            {profile.location && (
              <span>📍 {profile.location}</span>
            )}
            {profile.website && (
              <a href={profile.website} target="_blank" rel="noopener noreferrer">
                🔗 {profile.website}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="profile-stats">
        <div className="stat">
          <strong>{profile.postCount}</strong>
          <span>Posts</span>
        </div>
        <div className="stat">
          <strong>{profile.followerCount}</strong>
          <span>Followers</span>
        </div>
        <div className="stat">
          <strong>{profile.followingCount}</strong>
          <span>Following</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="profile-tabs">
        {['posts', 'media', 'likes'].map(tab => (
          <button
            key={tab}
            className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="profile-content">
        {activeTab === 'posts' && (
          <div className="posts-list">
            {posts.length === 0 ? (
              <div className="empty-state">
                <p>No posts yet</p>
              </div>
            ) : (
              posts.map(post => (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUser={currentUser}
                />
              ))
            )}
          </div>
        )}

        {activeTab === 'media' && (
          <div className="media-grid">
            {/* Media would be rendered here */}
            <p>No media posts yet</p>
          </div>
        )}

        {activeTab === 'likes' && (
          <div className="likes-list">
            {/* Liked posts would be rendered here */}
            <p>No liked posts yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
