import React from 'react';
import Messages from '../components/messages';
import '../styles/pages.css';

/**
 * Messages Page
 * Container for direct messaging
 */
const MessagesPage = ({ currentUser }) => {
  return (
    <div className="page-container messages-page">
      <Messages currentUser={currentUser} />
    </div>
  );
};

export default MessagesPage;
