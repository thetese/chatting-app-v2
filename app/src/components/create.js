import React, { useState } from 'react';
import '../styles/create.css';
import { PhotoIcon, VideoIcon, EmojiIcon } from './NavIcons';

/**
 * Create Post Component
 * Allows users to create new posts with text and media
 */
const CreatePost = ({ currentUser, onPostCreated }) => {
  const [content, setContent] = useState('');
  const [images, setImages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    setImages([...images, ...files]);
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!content.trim() && images.length === 0) {
      setError('Post cannot be empty');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('content', content);
      formData.append('userId', currentUser.id);
      images.forEach(img => formData.append('images', img));

      // API call would go here
      // const response = await fetch('/api/posts', {
      //   method: 'POST',
      //   body: formData
      // });
      // const newPost = await response.json();

      const newPost = {
        id: Date.now(),
        userId: currentUser.id,
        author: currentUser,
        content,
        images: [],
        likes: [],
        likeCount: 0,
        comments: [],
        commentCount: 0,
        createdAt: new Date()
      };

      onPostCreated(newPost);
      setContent('');
      setImages([]);
    } catch (err) {
      setError('Failed to create post');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="create-post-container">
      <div className="create-post-header">
        <img 
          src={currentUser?.profileImage || '/default-avatar.png'} 
          alt={currentUser?.username}
          className="profile-image"
        />
        <div className="create-post-input-wrapper">
          <form onSubmit={handleSubmit}>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind?"
              className="post-textarea"
              maxLength={5000}
            />
            
            {/* Image Preview */}
            {images.length > 0 && (
              <div className="image-preview-container">
                {images.map((img, idx) => (
                  <div key={idx} className="image-preview">
                    <img src={URL.createObjectURL(img)} alt={`preview-${idx}`} />
                    <button 
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="remove-image"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {error && <div className="error-message">{error}</div>}

            <div className="create-post-footer">
              <div className="post-actions">
                <label className="action-btn create-action-btn" title="Upload Image">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                  />
                  <span className="create-action-icon"><PhotoIcon /></span>
                  Photo
                </label>
                <button type="button" className="action-btn create-action-btn" title="Add Video">
                  <span className="create-action-icon"><VideoIcon /></span>
                  Video
                </button>
                <button type="button" className="action-btn create-action-btn" title="Add Emoji">
                  <span className="create-action-icon"><EmojiIcon /></span>
                  Emoji
                </button>
              </div>

              <button
                type="submit"
                className="submit-btn"
                disabled={isLoading || (!content.trim() && images.length === 0)}
              >
                {isLoading ? 'Posting...' : 'Post'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreatePost;
