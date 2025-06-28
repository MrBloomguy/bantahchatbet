import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';

interface EventChatMessage {
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
  isOptimistic?: boolean; // Flag for optimistic messages
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

export function useEventChat(eventId: string) {
  const [messages, setMessages] = useState<EventChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const { currentUser } = useAuth();
  const toast = useToast();
  const subscriptionRef = useRef<any>(null);
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

  const formatMessage = (msg: DatabaseMessage): EventChatMessage => ({
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
          reply_to,
          users!inner (
            id,
            name,
            username,
            avatar_url
          )
        `)
        .eq('event_id', eventId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const formattedMessages: EventChatMessage[] = (data || []).map(formatMessage);
      setMessages(formattedMessages);
      
      // Track loaded message IDs
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
    const optimisticMessage: EventChatMessage = {
      id: optimisticId,
      content,
      sender_id: currentUser.id,
      created_at: new Date().toISOString(),
      sender: {
        name: currentUser.user_metadata?.name || currentUser.email || 'Unknown',
        username: currentUser.user_metadata?.username,
        avatar_url: currentUser.user_metadata?.avatar_url || '/default-avatar.png'
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
        // Handle file upload
        if (file) {
          mediaUrl = await uploadImage(file);
          mediaType = 'image';
        } else if (content.match(/^https:\/\/media\d\.giphy\.com/)) {
          mediaUrl = content;
          mediaType = 'gif';
          content = ''; // Clear content as it's just the GIF URL
        }

        // Add optimistic message for immediate UI feedback
        optimisticId = addOptimisticMessage(content, mediaUrl, mediaType, metadata);

        // Send to database
        const { error } = await supabase
          .from('event_chat_messages')
          .insert([{
            event_id: eventId,
            sender_id: currentUser.id,
            content,
            media_url: mediaUrl || null,
            media_type: mediaType,
            mentions: metadata?.mentions || null,
            reply_to: metadata?.reply_to || null
          }]);

        if (error) throw error;

        // Success - the real-time subscription will handle replacing the optimistic message
        return true;
      } catch (error) {
        console.error('Error sending message:', error);
        toast.showError('Failed to send message.');
        
        // Remove optimistic message on failure
        if (optimisticId) {
          removeOptimisticMessage(optimisticId);
        }
        return false;
      }
    },
    [currentUser, eventId, toast, addOptimisticMessage, removeOptimisticMessage]
  );

  const handleRealtimeMessage = useCallback(async (payload: any) => {
    if (!payload.new || typeof payload.new !== 'object' || !('id' in payload.new)) return;

    const messageId = payload.new.id;
    if (!messageId || processedMessageIds.current.has(messageId)) return;

    try {
      // Fetch complete message data
      const { data: messageData, error } = await supabase
        .from('event_chat_messages')
        .select(`
          id,
          content,
          sender_id,
          created_at,
          media_url,
          media_type,
          mentions,
          reply_to,
          users!inner (
            id,
            name,
            username,
            avatar_url
          )
        `)
        .eq('id', messageId)
        .single();

      if (error || !messageData) {
        console.error('Error fetching message data:', error);
        return;
      }

      const newMessage = formatMessage(messageData);
      processedMessageIds.current.add(messageId);

      setMessages(prevMessages => {
        // Remove any optimistic message from the same sender with similar timestamp
        const filteredMessages = prevMessages.filter(msg => {
          if (!msg.isOptimistic) return true;
          
          // Remove optimistic message if it's from the same sender and within 10 seconds
          const timeDiff = Math.abs(
            new Date(newMessage.created_at).getTime() - new Date(msg.created_at).getTime()
          );
          return !(msg.sender_id === newMessage.sender_id && timeDiff < 10000);
        });

        // Add the new message and sort by timestamp
        const updatedMessages = [...filteredMessages, newMessage];
        return updatedMessages.sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      });
    } catch (error) {
      console.error('Error processing real-time message:', error);
    }
  }, []);

  // Initial message fetch
  useEffect(() => {
    fetchInitialMessages();
  }, [fetchInitialMessages]);

  // Real-time subscription with reconnection handling
  useEffect(() => {
    if (!eventId) return;

    const setupSubscription = () => {
      const channel = supabase.channel(`event-chat-${eventId}`, {
        config: {
          presence: { key: currentUser?.id }
        }
      });

      subscriptionRef.current = channel
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'event_chat_messages',
            filter: `event_id=eq.${eventId}`,
          },
          handleRealtimeMessage
        )
        .subscribe((status) => {
          console.log(`Event chat subscription status for ${eventId}:`, status);
          
          if (status === 'SUBSCRIBED') {
            setConnectionStatus('connected');
          } else if (status === 'CHANNEL_ERROR') {
            setConnectionStatus('disconnected');
            // Retry connection after 3 seconds
            setTimeout(setupSubscription, 3000);
          } else {
            setConnectionStatus('connecting');
          }
        });
    };

    setupSubscription();

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
  }, [eventId, currentUser, handleRealtimeMessage]);

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