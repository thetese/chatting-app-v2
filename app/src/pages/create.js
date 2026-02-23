import React from 'react';
import CreatePost from '../components/create';
import '../styles/pages.css';

/**
 * Create Page
 * Container for the post creation page
 */
const CreatePage = ({ currentUser, onPostCreated }) => {
  return (
    <div className="page-container create-page">
      <div className="page-content">
        <h1>Create New Post</h1>
        <CreatePost currentUser={currentUser} onPostCreated={onPostCreated} />
      </div>
    </div>
  );
};

export default CreatePage;
