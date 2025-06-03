import React, { useState, useCallback } from 'react';
import ChatThread from './ChatThread';

/**
 * ExpandedPostBody shows:
 *   • post.title
 *   • post.message
 *   • a “× Close” button (calls onClose)
 *   • a “★/☆ Favorite” button (calls onFavorite)
 *   • a toggle “Show Chat / Hide Chat” (renders <ChatThread> when open)
 *
 * Props:
 *   post         : { id, title, message, category, … }
 *   onClose      : () ⇒ void
 *   onFavorite   : () ⇒ void
 *   isFavorited  : boolean
 */
function ExpandedPostBody({ post, onClose, onFavorite, isFavorited }) {
  const [showChat, setShowChat] = useState(false);
  const toggleChat = useCallback(() => {
    setShowChat((v) => !v);
    console.log("🪪 Expanded post ", post.id);
  }, []);

  return (
    <>
      <h3 style={{ margin: '0 0 0.5rem' }}>{post.title}</h3>
      <p style={{ margin: '0 0 1rem' }}>{post.message}</p>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            fontSize: '1.25rem',
            cursor: 'pointer',
            padding: 0,
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