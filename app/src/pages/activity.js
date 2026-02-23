import React from 'react';
import Activity from '../components/activity';
import '../styles/pages.css';

/**
 * Activity Page
 * Container for notifications and activity feed
 */
const ActivityPage = ({ currentUser }) => {
  return (
    <div className="page-container activity-page">
      <Activity currentUser={currentUser} />
    </div>
  );
};

export default ActivityPage;
