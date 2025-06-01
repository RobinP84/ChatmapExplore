// src/Components/ExpandedPostBody.jsx
import React, { useState, useCallback } from 'react';
import ChatThread from './ChatThread';

function ExpandedPostBody({ post, onClose, onFavorite, isFavorited }) {
  const [showChat, setShowChat] = useState(false);
  const toggleChat = useCallback(() => {
    setShowChat(v => !v);
  }, []);

  return (
    <>
      <h3>{post.title}</h3>
      <p>{post.message}</p>
      <div className="actions" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        {/* Close button */}
        <button className="close-btn" onClick={onClose}>
          ×
        </button>

        {/* Favorite / Unfavorite button */}
        <button onClick={onFavorite}>
          {isFavorited ? '★ Unfavorite' : '☆ Favorite'}
        </button>

        {/* Show / Hide Chat toggle */}
        <button onClick={toggleChat}>
          {showChat ? 'Hide Chat' : 'Show Chat'}
        </button>
      </div>
      {showChat && <ChatThread postId={post.id} />}
    </>
  );
}

export default React.memo(ExpandedPostBody);