import React, { useState } from 'react';
import '../styles/messageinput.css';

/**
 * MessageInput Component
 * Input field for composing new messages
 */
const MessageInput = ({ onSendMessage }) => {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!message.trim()) return;

    try {
      setIsLoading(true);
      await onSendMessage(message);
      setMessage('');
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="message-input-form">
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type a message..."
        className="message-input"
        disabled={isLoading}
      />
      <button
        type="submit"
        disabled={isLoading || !message.trim()}
        className="send-btn"
      >
        {isLoading ? '⏳' : '📤'}
      </button>
    </form>
  );
};

export default MessageInput;
