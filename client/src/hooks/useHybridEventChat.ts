import { useEffect, useState, useCallback } from 'react';
import { useEventChat } from './useEventChat';
import { useWebSocketChat } from './useWebSocketChat';

// Define a common message type for merging
interface HybridChatMessage {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  [key: string]: any;
}

function normalizeWsMessages(wsMessages: any[], currentUser: any): HybridChatMessage[] {
  return wsMessages.map((msg) => {
    // If already has id and sender_id, return as is
    if (msg.id && msg.sender_id) return msg;
    // Otherwise, normalize
    return {
      id: msg.id || `${msg.sender || 'unknown'}_${msg.created_at || Date.now()}`,
      content: msg.content,
      created_at: msg.created_at || new Date().toISOString(),
      sender_id: msg.sender || currentUser?.id || 'unknown',
      ...msg,
    };
  });
}

export function useHybridEventChat(eventId: string, currentUser: any) {
  // Load history from DB
  const { messages: dbMessages, sendMessage: sendDbMessage, isLoading } = useEventChat(eventId);
  // Get instant messages from WebSocket
  const { messages: wsMessages, sendMessage: sendWsMessage } = useWebSocketChat(eventId, currentUser);

  // Merge and deduplicate messages by id
  const [mergedMessages, setMergedMessages] = useState<HybridChatMessage[]>([]);

  useEffect(() => {
    const wsNorm = normalizeWsMessages(wsMessages as any[], currentUser);
    const dbNorm = (dbMessages as HybridChatMessage[]);
    const all: HybridChatMessage[] = [...dbNorm, ...wsNorm];
    const seen = new Set<string>();
    const deduped = all.filter(msg => {
      if (!msg.id) return false;
      if (seen.has(msg.id)) return false;
      seen.add(msg.id);
      return true;
    });
    deduped.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    setMergedMessages(deduped);
  }, [dbMessages, wsMessages, currentUser]);

  // Send to both (DB for persistence, WS for instant)
  const sendMessage = useCallback((content: string, file?: File, metadata?: any) => {
    sendWsMessage(content);
    return sendDbMessage(content, file, metadata);
  }, [sendDbMessage, sendWsMessage]);

  return { messages: mergedMessages, sendMessage, isLoading };
}
