import React, { useState, useEffect } from 'react';
import '../styles/home.css';
import PostCard from './PostCard';
import CreatePost from './create';
import Story from './Story';

/**
 * Home Component
 * Main feed displaying posts from followed users and stories
 */
const Home = ({ currentUser, onPostCreated }) => {
  const [posts, setPosts] = useState([]);
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchFeed();
  }, [currentUser]);

  const fetchFeed = async () => {
    try {
      setLoading(true);
      // API call would go here
      // const response = await fetch(`/api/feed?userId=${currentUser.id}`);
      // const data = await response.json();
      setPosts([]);
      setStories([]);
      setError(null);
    } catch (err) {
      setError('Failed to load feed');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePostCreated = (newPost) => {
    setPosts([newPost, ...posts]);
    if (onPostCreated) onPostCreated(newPost);
  };

  const handlePostLike = (postId, liked) => {
    setPosts(posts.map(post =>
      post.id === postId
        ? {
            ...post,
            likes: liked
              ? [...post.likes, currentUser.id]
              : post.likes.filter(id => id !== currentUser.id),
            likeCount: post.likeCount + (liked ? 1 : -1)
          }
        : post
    ));
  };

  const handlePostDelete = (postId) => {
    setPosts(posts.filter(post => post.id !== postId));
  };

  if (loading) {
    return <div className="home-container"><div className="loading">Loading feed...</div></div>;
  }

  return (
    <div className="home-container">
      <div className="feed-wrapper">
        {/* Stories Section */}
        {stories.length > 0 && (
          <div className="stories-section">
            <div className="stories-carousel">
              {stories.map(story => (
                <Story key={story.id} story={story} currentUser={currentUser} />
              ))}
            </div>
          </div>
        )}

        {/* Create Post */}
        <CreatePost currentUser={currentUser} onPostCreated={handlePostCreated} />

        {/* Posts Feed */}
        <div className="posts-feed">
          {error && <div className="error-message">{error}</div>}
          {posts.length === 0 ? (
            <div className="empty-state">
              <p>No posts yet. Start following people to see their posts!</p>
            </div>
          ) : (
            posts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                currentUser={currentUser}
                onLike={handlePostLike}
                onDelete={handlePostDelete}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
