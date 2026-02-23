import React from 'react';
import '../styles/messagelist.css';

/**
 * MessageList Component
 * Displays a list of messages in a conversation
 */
const MessageList = ({ messages, currentUser }) => {
  return (
    <div className="message-list">
      {messages.map(message => (
        <div
          key={message.id}
          className={`message ${message.senderId === currentUser?.id ? 'sent' : 'received'}`}
        >
          <div className="message-content">
            <p>{message.content}</p>
            <span className="message-time">
              {new Date(message.createdAt).toLocaleTimeString()}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MessageList;
