// src/Components/ExpandedPostBody.jsx
// src/Components/ExpandedPostBody.jsx
import React, { useState, useCallback } from 'react';
import ChatThread from './ChatThread';

function ExpandedPostBody({ post, onClose, onFavorite, isFavorited }) {
  console.log('Post clicked');
  console.log('ExpandedPostBody got post=', post);
  const [showChat, setShowChat] = useState(false);
  const toggleChat = useCallback(() => {
    setShowChat((v) => !v);
  }, []);

  return (
    <>
      <h3 style={{ margin: '0 0 0.5rem 0' }}>{post.title}</h3>
      <p style={{ margin: '0 0 1rem 0' }}>{post.message}</p>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            fontSize: '1.25rem',
            cursor: 'pointer',
          }}
        >
          ×
        </button>
        <button onClick={onFavorite} style={{ cursor: 'pointer' }}>
          {isFavorited ? '★ Unfavorite' : '☆ Favorite'}
        </button>
        <button onClick={toggleChat} style={{ cursor: 'pointer' }}>
          {showChat ? 'Hide Chat' : 'Show Chat'}
        </button>
      </div>
      {showChat && <ChatThread postId={post.id} />}
    </>
  );
}

export default React.memo(ExpandedPostBody);