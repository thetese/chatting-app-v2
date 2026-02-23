import React, { useState } from 'react';
import '../styles/postcard.css';
import CommentSection from './CommentSection';

/**
 * PostCard Component
 * Reusable component to display individual posts
 */
const PostCard = ({ post, currentUser, onLike, onDelete, compact = false }) => {
  const [isLiked, setIsLiked] = useState(post.likes?.includes(currentUser?.id));
  const [showComments, setShowComments] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLike = async () => {
    try {
      const newLikedState = !isLiked;
      setIsLiked(newLikedState);
      
      // API call would go here
      // await fetch(`/api/posts/${post.id}/like`, {
      //   method: newLikedState ? 'POST' : 'DELETE'
      // });

      if (onLike) {
        onLike(post.id, newLikedState);
      }
    } catch (err) {
      setIsLiked(!isLiked);
      console.error('Failed to like post:', err);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;

    try {
      // API call would go here
      // await fetch(`/api/posts/${post.id}`, { method: 'DELETE' });
      
      if (onDelete) {
        onDelete(post.id);
      }
    } catch (err) {
      console.error('Failed to delete post:', err);
    }
  };

  const isOwnPost = currentUser?.id === post.userId;

  if (compact) {
    return (
      <div className="post-card-compact">
        {post.images?.[0] && (
          <img src={post.images[0]} alt="post" className="post-thumbnail" />
        )}
        <div className="compact-overlay">
          <span className="like-count">❤️ {post.likeCount}</span>
          <span className="comment-count">💬 {post.commentCount}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="post-card">
      {/* Header */}
      <div className="post-header">
        <div className="post-author">
          <img
            src={post.author?.profileImage || '/default-avatar.png'}
            alt={post.author?.username}
            className="author-avatar"
          />
          <div className="author-info">
            <h4>{post.author?.fullName}</h4>
            <p className="username">@{post.author?.username}</p>
            <span className="timestamp">
              {new Date(post.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        {isOwnPost && (
          <div className="post-menu">
            <button
              className="menu-btn"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              ⋮
            </button>
            {isMenuOpen && (
              <div className="menu-dropdown">
                <button onClick={handleDelete}>Delete Post</button>
                <button>Edit Post</button>
                <button>Share</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="post-content">
        <p className="post-text">{post.content}</p>

        {post.images && post.images.length > 0 && (
          <div className="post-images">
            {post.images.map((img, idx) => (
              <img key={idx} src={img} alt={`post-${idx}`} />
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="post-stats">
        <span>{post.likeCount} Likes</span>
        <span>{post.commentCount} Comments</span>
      </div>

      {/* Actions */}
      <div className="post-actions">
        <button
          className={`action-btn ${isLiked ? 'active' : ''}`}
          onClick={handleLike}
        >
          {isLiked ? '❤️' : '🤍'} Like
        </button>
        <button
          className="action-btn"
          onClick={() => setShowComments(!showComments)}
        >
          💬 Comment
        </button>
        <button className="action-btn">
          🔄 Share
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <CommentSection postId={post.id} currentUser={currentUser} />
      )}
    </div>
  );
};

export default PostCard;
