// src/Components/MakePostBody.jsx
import React, { useState } from 'react';

export default function MakePostBody({ onClose, onSave }) {
  const [title, setTitle]     = useState('');
  const [message, setMessage] = useState('');

  return (
    <div>
      <input
        type="text"
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Title"
        style={{ width: '100%', marginBottom: '0.5rem' }}
      />
      <textarea
        value={message}
        onChange={e => setMessage(e.target.value)}
        placeholder="Message"
        style={{ width: '100%', height: '4rem', marginBottom: '0.5rem' }}
      />
      <div className="actions" style={{ display: 'flex', gap: '0.5rem' }}>
        <button onClick={onClose}>Cancel</button>
        <button onClick={() => onSave({ title, message })}>
          Post
        </button>
      </div>
    </div>
  );
}