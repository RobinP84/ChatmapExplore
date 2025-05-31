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
      />
      <textarea
        value={message}
        onChange={e => setMessage(e.target.value)}
        placeholder="Message"
      />
      <div className="actions">
        <button onClick={onClose}>Cancel</button>
        <button onClick={() => onSave({ title, message })}>
          Post
        </button>
      </div>
    </div>
  );
}