import React from 'react';
import Veeme from '../components/Veeme';

/**
 * Veeme Page - Short videos with endless scroll
 */
const VeemePage = ({ currentUser }) => {
  return (
    <div className="page-container veeme-page">
      <Veeme currentUser={currentUser} />
    </div>
  );
};

export default VeemePage;
