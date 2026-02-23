import React, { useState, useEffect } from 'react';
import Profile from '../components/profile';
import '../styles/pages.css';

/**
 * Profile Page
 * Container for user profile display
 */
const ProfilePage = ({ userId, currentUser }) => {
  return (
    <div className="page-container profile-page">
      <Profile userId={userId} currentUser={currentUser} />
    </div>
  );
};

export default ProfilePage;
