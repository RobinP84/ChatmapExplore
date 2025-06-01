// src/Components/ExpandedPostBody.jsx

import React, { useState, useCallback } from 'react';
import ChatThread from './ChatThread';

/**
 * ExpandedPostBody displays:
 *   • post.title
 *   • post.message
 *   • a “× Close” button (calls onClose)
 *   • a “★/☆ Favorite” button (calls onFavorite)
 *   • a toggle “Show Chat / Hide Chat” (renders ChatThread if true)
 *
 * Props:
 *   - post         ({ id, title, message, category, … })
 *   - onClose      (function) closes this expanded view
 *   - onFavorite   (function) toggles “favorite” status
 *   - isFavorited  (boolean) whether the post is already favourited
 */
function ExpandedPostBody({ post, onClose, onFavorite, isFavorited }) {
  // DEBUG: confirm this runs when the window expands
  console.log('>>> ExpandedPostBody mounted for post:', post);

  const [showChat, setShowChat] = useState(false);
  const toggleChat = useCallback(() => {
    setShowChat((v) => !v);
  }, []);

  return (
    <>
      <h3 style={{ margin: '0 0 0.5rem 0' }}>{post.title}</h3>
      <p style={{ margin: '0 0 1rem 0' }}>{post.message}</p>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        {/* Close button */}
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

        {/* Favorite / Unfavorite button */}
        <button onClick={onFavorite} style={{ cursor: 'pointer' }}>
          {isFavorited ? '★ Unfavorite' : '☆ Favorite'}
        </button>

        {/* Show / Hide Chat toggle */}
        <button onClick={toggleChat} style={{ cursor: 'pointer' }}>
          {showChat ? 'Hide Chat' : 'Show Chat'}
        </button>
      </div>

      {showChat && <ChatThread postId={post.id} />}
    </>
  );
}

export default React.memo(ExpandedPostBody);