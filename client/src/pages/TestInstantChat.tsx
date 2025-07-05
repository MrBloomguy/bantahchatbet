import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useWebSocketChat } from '../hooks/useWebSocketChat';

const TestInstantChat: React.FC = () => {
  const { currentUser } = useAuth();
  const [roomId, setRoomId] = useState('test-room');
  const [input, setInput] = useState('');
  const { messages, sendMessage } = useWebSocketChat(roomId, currentUser);

  return (
    <div style={{ maxWidth: 400, margin: '40px auto', border: '1px solid #ccc', borderRadius: 8, padding: 16 }}>
      <h2>Instant Chat Test</h2>
      <div style={{ marginBottom: 12 }}>
        <label>Room ID: </label>
        <input value={roomId} onChange={e => setRoomId(e.target.value)} style={{ width: 200 }} />
      </div>
      <div style={{ height: 200, overflowY: 'auto', border: '1px solid #eee', marginBottom: 12, padding: 8 }}>
        {messages.map((msg, idx) => (
          <div key={idx} style={{ marginBottom: 6 }}>
            <b>{msg.sender || msg.sender_id || 'anon'}:</b> {msg.content} <span style={{ color: '#aaa', fontSize: 10 }}>{msg.created_at}</span>
          </div>
        ))}
      </div>
      <form onSubmit={e => { e.preventDefault(); if (input.trim()) { sendMessage(input); setInput(''); } }}>
        <input value={input} onChange={e => setInput(e.target.value)} style={{ width: 250 }} placeholder="Type a message..." />
        <button type="submit">Send</button>
      </form>
    </div>
  );
};

export default TestInstantChat;
