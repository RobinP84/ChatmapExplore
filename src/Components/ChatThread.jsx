// src/Components/ChatThread.jsx
import React, { useEffect, useState } from 'react';

function ChatThread({ postId }) {
  const [messages, setMessages] = useState([]);
  useEffect(() => {
    // Imagine fetching `/api/posts/${postId}/thread`
    // For now just simulate:
    setMessages([{ id:1, user:'Alice', text:'Hi there!' }]);
  }, [postId]);

  return (
    <div className="chat-thread">
      {messages.map(m => (
        <div key={m.id}><strong>{m.user}:</strong> {m.text}</div>
      ))}
    </div>
  );
}

export default React.memo(ChatThread);