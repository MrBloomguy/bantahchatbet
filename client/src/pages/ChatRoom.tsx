import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

// Use the Codespaces public Socket.IO URL (https, not ws/wss)
const SOCKET_URL = 'https://obscure-space-doodle-wprxw47wprvfgv9g-4000.app.github.dev/';

type Message = { sender: string; content: string; created_at: string };

const getGuestName = () => 'Guest_' + Math.random().toString(36).slice(2, 7);

const ChatRoom = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const guestName = useRef(getGuestName());
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState('connecting');

  useEffect(() => {
    const s = io(SOCKET_URL, { transports: ['websocket'] });
    setSocket(s);
    s.on('connect', () => setStatus('connected'));
    s.on('disconnect', () => setStatus('disconnected'));
    s.on('connect_error', () => setStatus('error'));
    s.on('chat message', (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
    });
    return () => {
      s.disconnect();
    };
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!socket || socket.disconnected) {
      alert('Socket.IO is not connected. Please refresh the page.');
      return;
    }
    if (input.trim()) {
      socket.emit('chat message', {
        sender: guestName.current,
        content: input,
        created_at: new Date().toLocaleTimeString(),
      });
      setInput('');
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '40px auto', border: '1px solid #ccc', borderRadius: 8, padding: 16 }}>
      <h2>Group Chatroom (Socket.IO)</h2>
      {status !== 'connected' && (
        <div style={{ background: '#fee2e2', color: '#b91c1c', padding: 10, textAlign: 'center', fontWeight: 600 }}>
          Socket.IO status: {status}. Make sure the server is running and the URL is correct.
        </div>
      )}
      <div style={{ height: 300, overflowY: 'auto', border: '1px solid #eee', marginBottom: 8, padding: 8 }}>
        {messages.map((msg, idx) => (
          <div key={idx} style={{ marginBottom: 6 }}>
            <b>{msg.sender}:</b> {msg.content} <span style={{ color: '#aaa', fontSize: 10 }}>{msg.created_at}</span>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>
      <form onSubmit={sendMessage} style={{ display: 'flex', gap: 8 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          style={{ flex: 1, borderRadius: 4, border: '1px solid #ccc', padding: 8 }}
          placeholder="Type a message..."
        />
        <button type="submit" style={{ padding: '8px 16px' }}>Send</button>
      </form>
    </div>
  );
};

export default ChatRoom;
