import React from 'react';
import Home from '../components/home';
import '../styles/pages.css';

/**
 * Home Page
 * Container for the home feed page
 */
const HomePage = ({ currentUser, onPostCreated }) => {
  return (
    <div className="page-container home-page">
      <Home currentUser={currentUser} onPostCreated={onPostCreated} />
    </div>
  );
};

export default HomePage;
