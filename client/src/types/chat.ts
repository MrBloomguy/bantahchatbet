export interface User {
  id: string;
  name: string;
  avatar_url: string;
  status: 'online' | 'offline';
}

export interface Message {
  id: string;
  event_id: string;
  sender_id: string;
  content: string;
  type: 'text' | 'image' | 'file';
  file_url?: string;
  created_at: string;
  updated_at: string;
  username: string;
  name: string;
  avatar_url?: string;
  reactions?: MessageReaction[];
}

export interface MessageReaction {
  id: string;
  emoji: string;
  message_id: string;
  user_id: string;
  created_at: string;
}