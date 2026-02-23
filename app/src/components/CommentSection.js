import React, { useState } from 'react';
import '../styles/commentsection.css';

/**
 * CommentSection Component
 * Displays and manages comments for a post
 */
const CommentSection = ({ postId, currentUser }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddComment = async (e) => {
    e.preventDefault();
    
    if (!newComment.trim()) return;

    try {
      setLoading(true);

      const comment = {
        id: Date.now(),
        postId,
        userId: currentUser.id,
        author: currentUser,
        content: newComment,
        likes: [],
        likeCount: 0,
        createdAt: new Date()
      };

      // API call would go here
      // await fetch(`/api/posts/${postId}/comments`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(comment)
      // });

      setComments([comment, ...comments]);
      setNewComment('');
    } catch (err) {
      console.error('Failed to add comment:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      // API call would go here
      // await fetch(`/api/comments/${commentId}`, { method: 'DELETE' });
      
      setComments(comments.filter(c => c.id !== commentId));
    } catch (err) {
      console.error('Failed to delete comment:', err);
    }
  };

  return (
    <div className="comment-section">
      {/* Comment Form */}
      <form onSubmit={handleAddComment} className="comment-form">
        <img
          src={currentUser?.profileImage || '/default-avatar.png'}
          alt={currentUser?.username}
          className="comment-avatar"
        />
        <div className="comment-input-wrapper">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            className="comment-input"
          />
          <button
            type="submit"
            disabled={loading || !newComment.trim()}
            className="comment-submit-btn"
          >
            {loading ? 'Posting...' : 'Post'}
          </button>
        </div>
      </form>

      {/* Comments List */}
      <div className="comments-list">
        {comments.length === 0 ? (
          <p className="no-comments">No comments yet. Be the first to comment!</p>
        ) : (
          comments.map(comment => (
            <div key={comment.id} className="comment">
              <img
                src={comment.author?.profileImage || '/default-avatar.png'}
                alt={comment.author?.username}
                className="comment-avatar"
              />
              <div className="comment-content">
                <div className="comment-header">
                  <strong>{comment.author?.fullName}</strong>
                  <span className="comment-username">@{comment.author?.username}</span>
                </div>
                <p className="comment-text">{comment.content}</p>
                <div className="comment-actions">
                  <button className="comment-action">Like ({comment.likeCount})</button>
                  <button className="comment-action">Reply</button>
                  {currentUser?.id === comment.userId && (
                    <button
                      className="comment-action delete"
                      onClick={() => handleDeleteComment(comment.id)}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CommentSection;
