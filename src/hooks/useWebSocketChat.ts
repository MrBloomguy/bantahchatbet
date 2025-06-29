import { useEffect, useRef, useState, useCallback } from 'react';

interface WebSocketMessage {
  type: string;
  room: string;
  sender?: string;
  content: string;
  created_at: string;
}

export function useWebSocketChat(eventId: string, currentUser: any) {
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    ws.current = new window.WebSocket('ws://localhost:3001');
    ws.current.onopen = () => {
      ws.current?.send(JSON.stringify({ type: 'join', room: eventId }));
    };
    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'message') {
        setMessages(prev => [...prev, data]);
      }
    };
    return () => {
      ws.current?.close();
    };
  }, [eventId]);

  const sendMessage = useCallback((content: string) => {
    if (ws.current && ws.current.readyState === window.WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        type: 'message',
        room: eventId,
        sender: currentUser?.id,
        content,
        created_at: new Date().toISOString(),
      }));
    }
  }, [eventId, currentUser]);

  return { messages, sendMessage };
}
