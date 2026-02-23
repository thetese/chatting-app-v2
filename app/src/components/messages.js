import React, { useState, useEffect } from 'react';
import '../styles/messages.css';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

/**
 * Messages Component
 * Direct messaging between users
 */
const Messages = ({ currentUser }) => {
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConversations();
  }, [currentUser]);

  useEffect(() => {
    if (activeConversation) {
      fetchMessages(activeConversation.id);
    }
  }, [activeConversation]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      // API call would go here
      // const response = await fetch(`/api/conversations?userId=${currentUser.id}`);
      // const data = await response.json();
      setConversations([]);
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId) => {
    try {
      // API call would go here
      // const response = await fetch(`/api/conversations/${conversationId}/messages`);
      // const data = await response.json();
      setMessages([]);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
  };

  const handleSendMessage = async (content) => {
    if (!activeConversation) return;

    try {
      const newMessage = {
        id: Date.now(),
        conversationId: activeConversation.id,
        senderId: currentUser.id,
        content,
        createdAt: new Date(),
        isRead: true
      };

      // API call would go here
      // await fetch(`/api/conversations/${activeConversation.id}/messages`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(newMessage)
      // });

      setMessages([...messages, newMessage]);
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.participantName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="messages-container">
      <div className="messages-sidebar">
        <div className="messages-header">
          <h2>Messages</h2>
        </div>

        <div className="search-conversations">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="search-input"
          />
        </div>

        <div className="conversations-list">
          {loading ? (
            <div className="loading">Loading conversations...</div>
          ) : filteredConversations.length === 0 ? (
            <div className="empty-state">
              <p>No conversations yet</p>
            </div>
          ) : (
            filteredConversations.map(conv => (
              <div
                key={conv.id}
                className={`conversation-item ${activeConversation?.id === conv.id ? 'active' : ''}`}
                onClick={() => setActiveConversation(conv)}
              >
                <img
                  src={conv.participantImage || '/default-avatar.png'}
                  alt={conv.participantName}
                  className="conversation-avatar"
                />
                <div className="conversation-info">
                  <h4>{conv.participantName}</h4>
                  <p className="last-message">{conv.lastMessage}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="messages-main">
        {activeConversation ? (
          <>
            <div className="messages-header-main">
              <h3>{activeConversation.participantName}</h3>
            </div>
            
            <MessageList
              messages={messages}
              currentUser={currentUser}
            />
            
            <MessageInput onSendMessage={handleSendMessage} />
          </>
        ) : (
          <div className="empty-state-main">
            <p>Select a conversation to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
