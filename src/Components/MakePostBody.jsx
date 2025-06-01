// src/Components/MakePostBody.jsx
import React, { useState } from 'react';

export default function MakePostBody({ onClose, onSave }) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
        style={{ padding: '0.25rem', fontSize: '1rem' }}
      />
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Message"
        style={{ padding: '0.25rem', fontSize: '1rem', minHeight: '4rem' }}
      />
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button onClick={onClose} style={{ cursor: 'pointer' }}>
          Cancel
        </button>
        <button
          onClick={() => onSave({ title, message })}
          style={{ cursor: 'pointer' }}
        >
          Post
        </button>
      </div>
    </div>
  );
}