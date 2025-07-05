
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';
import Pusher from 'pusher-js';

interface PusherChatMessage {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  sender?: {
    name: string;
    username?: string;
    avatar_url: string;
    isVerified?: boolean;
  };
  media_type?: 'image' | 'gif';
  media_url?: string;
  mentions?: Array<{
    id: string;
    username: string;
  }>;
  reply_to?: {
    id: string;
    content: string;
    sender_username?: string;
  };
  isOptimistic?: boolean;
}

interface DatabaseMessage {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  media_url: string | null;
  media_type: 'image' | 'gif' | null;
  mentions: Array<{ id: string; username: string }> | null;
  reply_to: {
    id: string;
    content: string;
    sender_username?: string;
  } | null;
  users: {
    id: string;
    name: string;
    username: string | null;
    avatar_url: string | null;
  }[];
}

export function usePusherChat(eventId: string) {
  const [messages, setMessages] = useState<PusherChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const { currentUser } = useAuth();
  const toast = useToast();
  const pusherRef = useRef<Pusher | null>(null);
  const channelRef = useRef<any>(null);
  const processedMessageIds = useRef(new Set<string>());

  const uploadImage = async (file: File): Promise<string> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `event_chat/${eventId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('chat-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('chat-images')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  const formatMessage = (msg: DatabaseMessage): PusherChatMessage => ({
    id: msg.id,
    content: msg.content,
    sender_id: msg.sender_id,
    created_at: msg.created_at,
    sender: {
      name: msg.users[0]?.name || 'Unknown',
      username: msg.users[0]?.username || undefined,
      avatar_url: msg.users[0]?.avatar_url || '/default-avatar.png'
    },
    media_type: msg.media_type || undefined,
    media_url: msg.media_url || undefined,
    mentions: msg.mentions || undefined,
    reply_to: msg.reply_to || undefined
  });

  const fetchInitialMessages = useCallback(async () => {
    if (!eventId) return;
    
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('event_chat_messages')
        .select(`
          id,
          content,
          sender_id,
          created_at,
          media_url,
          media_type,
          mentions,
          reply_to
        `)
        .eq('event_id', eventId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const formattedMessages: PusherChatMessage[] = await Promise.all((data || []).map(async (msg: any) => {
        // Try to fetch user profile, fallback to basic info if permission denied
        let userData = null;
        try {
          const { data: userResult } = await supabase
            .from('users')
            .select('id, name, username, avatar_url')
            .eq('id', msg.sender_id)
            .single();
          userData = userResult;
        } catch (error) {
          console.log('Could not fetch user data for', msg.sender_id, error);
        }

        return {
          id: msg.id,
          content: msg.content,
          sender_id: msg.sender_id,
          created_at: msg.created_at,
          sender: {
            name: userData?.name || 'User',
            username: userData?.username || undefined,
            avatar_url: userData?.avatar_url || '/default-avatar.png'
          },
          media_type: msg.media_type || undefined,
          media_url: msg.media_url || undefined,
          mentions: msg.mentions || undefined,
          reply_to: msg.reply_to || undefined
        };
      }));
      setMessages(formattedMessages);
      
      formattedMessages.forEach(msg => processedMessageIds.current.add(msg.id));
      
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.showError('Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  }, [eventId, toast]);

  const addOptimisticMessage = useCallback((content: string, mediaUrl?: string, mediaType?: 'image' | 'gif', metadata?: any) => {
    if (!currentUser) return null;

    const optimisticId = `optimistic_${Date.now()}_${Math.random()}`;
    const optimisticMessage: PusherChatMessage = {
      id: optimisticId,
      content,
      sender_id: currentUser.id,
      created_at: new Date().toISOString(),
      sender: {
        name: currentUser.name || currentUser.user_metadata?.name || currentUser.email || 'User',
        username: currentUser.username || currentUser.user_metadata?.username || 'user',
        avatar_url: currentUser.avatar_url || currentUser.user_metadata?.avatar_url || '/default-avatar.png'
      },
      media_type: mediaType,
      media_url: mediaUrl,
      mentions: metadata?.mentions,
      reply_to: metadata?.reply_to,
      isOptimistic: true
    };

    setMessages(prev => [...prev, optimisticMessage]);
    return optimisticId;
  }, [currentUser]);

  const removeOptimisticMessage = useCallback((optimisticId: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== optimisticId));
  }, []);

  const sendMessage = useCallback(
    async (content: string, file?: File, metadata?: {
      mentions?: Array<{ id: string; username: string }>;
      reply_to?: {
        id: string;
        content: string;
        sender_username?: string;
      };
    }): Promise<boolean> => {
      if (!currentUser) {
        toast.showError('You must be logged in to send messages.');
        return false;
      }

      let mediaUrl = '';
      let mediaType: 'image' | 'gif' | undefined;
      let optimisticId: string | null = null;

      try {
        if (file) {
          mediaUrl = await uploadImage(file);
          mediaType = 'image';
        } else if (content.match(/^https:\/\/media\d\.giphy\.com/)) {
          mediaUrl = content;
          mediaType = 'gif';
          content = '';
        }

        optimisticId = addOptimisticMessage(content, mediaUrl, mediaType, metadata);

        const { data: newMessage, error } = await supabase
          .from('event_chat_messages')
          .insert([{
            event_id: eventId,
            sender_id: currentUser.id,
            content,
            media_url: mediaUrl || null,
            media_type: mediaType,
            mentions: metadata?.mentions || null,
            reply_to: metadata?.reply_to || null
          }])
          .select(`
            id,
            content,
            sender_id,
            created_at,
            media_url,
            media_type
          `)
          .single();

        if (error) throw error;

        // Send via Pusher
        const response = await fetch('/api/pusher/message', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${currentUser.access_token || ''}`
          },
          body: JSON.stringify({
            channel: `event-chat-${eventId}`,
            event: 'new-message',
            data: {
              ...newMessage,
              sender: {
                name: currentUser.name || currentUser.user_metadata?.name || currentUser.email || 'User',
                username: currentUser.username || currentUser.user_metadata?.username || 'user',
                avatar_url: currentUser.avatar_url || currentUser.user_metadata?.avatar_url || '/default-avatar.png'
              }
            }
          })
        });

        if (!response.ok) throw new Error('Failed to send via Pusher');

        return true;
      } catch (error) {
        console.error('Error sending message:', error);
        toast.showError('Failed to send message.');
        
        if (optimisticId) {
          removeOptimisticMessage(optimisticId);
        }
        return false;
      }
    },
    [currentUser, eventId, toast, addOptimisticMessage, removeOptimisticMessage]
  );

  // Initialize Pusher connection
  useEffect(() => {
    if (!eventId) return;

    const setupPusher = () => {
      pusherRef.current = new Pusher('decd2cca5e39cf0cbcd4', {
        cluster: 'mt1',
        encrypted: true,
        authEndpoint: '/api/pusher/auth',
        auth: {
          headers: {
            'Authorization': `Bearer ${currentUser?.access_token || ''}`
          }
        }
      });

      pusherRef.current.connection.bind('state_change', (states: any) => {
        setConnectionStatus(states.current);
      });

      channelRef.current = pusherRef.current.subscribe(`event-chat-${eventId}`);
      
      channelRef.current.bind('new-message', (data: any) => {
        if (!data.id || processedMessageIds.current.has(data.id)) return;

        processedMessageIds.current.add(data.id);

        setMessages(prevMessages => {
          const filteredMessages = prevMessages.filter(msg => {
            if (!msg.isOptimistic) return true;
            const timeDiff = Math.abs(
              new Date(data.created_at).getTime() - new Date(msg.created_at).getTime()
            );
            return !(msg.sender_id === data.sender_id && timeDiff < 10000);
          });

          const updatedMessages = [...filteredMessages, data];
          return updatedMessages.sort((a, b) => 
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        });
      });
    };

    setupPusher();

    return () => {
      if (channelRef.current) {
        pusherRef.current?.unsubscribe(`event-chat-${eventId}`);
      }
      if (pusherRef.current) {
        pusherRef.current.disconnect();
      }
    };
  }, [eventId, currentUser]);

  // Fetch initial messages
  useEffect(() => {
    fetchInitialMessages();
  }, [fetchInitialMessages]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      processedMessageIds.current.clear();
    };
  }, []);

  return {
    messages,
    sendMessage,
    isLoading,
    connectionStatus
  };
}
