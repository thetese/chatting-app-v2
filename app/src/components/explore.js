import React, { useState, useEffect } from 'react';
import '../styles/explore.css';
import PostCard from './PostCard';

/**
 * Explore Component
 * Discover popular posts, hashtags, and trending content
 */
const Explore = ({ currentUser }) => {
  const [posts, setPosts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [activeTab, setActiveTab] = useState('posts'); // posts, users, hashtags
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTrending();
  }, []);

  const fetchTrending = async () => {
    try {
      setLoading(true);
      // API call would go here
      // const response = await fetch('/api/trending');
      // const data = await response.json();
      setPosts([]);
    } catch (err) {
      console.error('Failed to fetch trending posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setLoading(true);
      // API call would go here
      // const response = await fetch(`/api/search?q=${searchQuery}&type=${activeTab}`);
      // const data = await response.json();
      setSearchResults([]);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePostLike = (postId, liked) => {
    const updatePosts = (postList) =>
      postList.map(post =>
        post.id === postId
          ? {
              ...post,
              likes: liked
                ? [...post.likes, currentUser.id]
                : post.likes.filter(id => id !== currentUser.id),
              likeCount: post.likeCount + (liked ? 1 : -1)
            }
          : post
      );
    
    setPosts(updatePosts(posts));
    setSearchResults(updatePosts(searchResults));
  };

  return (
    <div className="explore-container">
      {/* Search Bar */}
      <div className="explore-header">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search posts, users, hashtags..."
            className="search-input"
          />
          <button type="submit" className="search-btn">🔍</button>
        </form>
      </div>

      {/* Tabs */}
      <div className="explore-tabs">
        {['posts', 'users', 'hashtags'].map(tab => (
          <button
            key={tab}
            className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
            onClick={() => {
              setActiveTab(tab);
              setSearchResults([]);
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="explore-content">
        {loading && <div className="loading">Loading...</div>}

        {searchQuery && searchResults.length === 0 && !loading && (
          <div className="empty-state">
            <p>No results found for "{searchQuery}"</p>
          </div>
        )}

        {/* Posts Tab */}
        {activeTab === 'posts' && (
          <div className="posts-grid">
            {(searchQuery ? searchResults : posts).map(post => (
              <PostCard
                key={post.id}
                post={post}
                currentUser={currentUser}
                onLike={handlePostLike}
                compact={true}
              />
            ))}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="users-list">
            {/* Users would be rendered here */}
            <p>Search for users to see results</p>
          </div>
        )}

        {/* Hashtags Tab */}
        {activeTab === 'hashtags' && (
          <div className="hashtags-list">
            {/* Hashtags would be rendered here */}
            <p>Popular hashtags will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Explore;
