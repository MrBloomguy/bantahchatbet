import { WebSocketServer } from 'ws';
import { supabase } from '../lib/supabase';

interface ChatMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
}

interface WebSocketClient extends WebSocket {
  userId?: string;
}

const wss = new WebSocketServer({ port: 8080 });
const clients = new Map<string, WebSocketClient>();

wss.on('connection', (ws: WebSocketClient) => {
  ws.on('message', async (message: string) => {
    try {
      const data = JSON.parse(message);
      
      switch (data.type) {
        case 'auth': {
          ws.userId = data.userId;
          clients.set(data.userId, ws);
          break;
        }
        
        case 'chat': {
          if (!ws.userId) {
            ws.send(JSON.stringify({ type: 'error', message: 'Not authenticated' }));
            return;
          }

          const chatMessage: ChatMessage = {
            id: crypto.randomUUID(),
            sender_id: ws.userId,
            receiver_id: data.receiverId,
            content: data.content,
            created_at: new Date().toISOString()
          };

          // Store message in Supabase
          const { error: messageError } = await supabase
            .from('messages')
            .insert(chatMessage);

          if (messageError) {
            ws.send(JSON.stringify({ type: 'error', message: 'Failed to save message' }));
            return;
          }

          // Create notification
          const { error: notificationError } = await supabase
            .from('notifications')
            .insert({
              user_id: data.receiverId,
              type: 'new_message',
              data: { sender_id: ws.userId }
            });

          if (notificationError) {
            console.error('Error creating notification:', notificationError);
          }

          // Send to receiver if online
          const receiverWs = clients.get(data.receiverId);
          if (receiverWs) {
            receiverWs.send(JSON.stringify({
              type: 'message',
              message: chatMessage
            }));
          }

          // Send confirmation to sender
          ws.send(JSON.stringify({
            type: 'message_sent',
            message: chatMessage
          }));
          break;
        }
      }
    } catch (error) {
      ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
    }
  });

  ws.on('close', () => {
    if (ws.userId) {
      clients.delete(ws.userId);
    }
  });
});

process.on('SIGINT', () => {
  wss.close(() => {
    process.exit(0);
  });
});