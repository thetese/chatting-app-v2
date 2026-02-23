import React from 'react';
import Explore from '../components/explore';
import '../styles/pages.css';

/**
 * Explore Page
 * Container for content discovery and search
 */
const ExplorePage = ({ currentUser }) => {
  return (
    <div className="page-container explore-page">
      <Explore currentUser={currentUser} />
    </div>
  );
};

export default ExplorePage;
