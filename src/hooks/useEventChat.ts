import { useState, useEffect, useCallback } from 'react';
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
  const { currentUser } = useAuth();
  const toast = useToast();

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

      const formattedMessages: EventChatMessage[] = (data || []).map((msg: DatabaseMessage) => ({
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
        media_url: msg.media_url || undefined
      }));

      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.showError('Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  }, [eventId, toast]);

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

      try {
        let mediaUrl = '';
        let mediaType: 'image' | 'gif' | undefined;

        if (file) {
          mediaUrl = await uploadImage(file);
          mediaType = 'image';
        } else if (content.match(/^https:\/\/media\d\.giphy\.com/)) {
          mediaUrl = content;
          mediaType = 'gif';
          content = ''; // Clear content as it's just the GIF URL
        }

        const { data, error } = await supabase
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
          .single();

        if (error) throw error;

        const formattedMessage: EventChatMessage = {
          id: data.id,
          content: data.content,
          sender_id: data.sender_id,
          created_at: data.created_at,
          sender: {
            name: data.users[0]?.name || 'Unknown',
            username: data.users[0]?.username || undefined,
            avatar_url: data.users[0]?.avatar_url || '/default-avatar.png'
          },
          media_type: data.media_type || undefined,
          media_url: data.media_url || undefined,
          mentions: data.mentions || undefined,
          reply_to: data.reply_to || undefined
        };

        setMessages((prevMessages) => [...prevMessages, formattedMessage]);
        return true;
      } catch (error) {
        console.error('Error sending message:', error);
        toast.showError('Failed to send message.');
        return false;
      }
    },
    [currentUser, eventId, toast]
  );

  // Initial message fetch
  useEffect(() => {
    fetchInitialMessages();
  }, [fetchInitialMessages]);

  // Real-time subscription
  useEffect(() => {
    if (!eventId) return;

    const channel = supabase.channel(`event-chat-${eventId}`);

    const subscription = channel
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all changes
          schema: 'public',
          table: 'event_chat_messages',
          filter: `event_id=eq.${eventId}`,
        },
        async (payload) => {
          if (!payload.new) return;

          // Fetch complete message data with sender info
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
            .eq('id', payload.new.id)
            .single();

          if (error || !messageData) {
            console.error('Error fetching message data:', error);
            return;
          }

          const newMessage: EventChatMessage = {
            id: messageData.id,
            content: messageData.content,
            sender_id: messageData.sender_id,
            created_at: messageData.created_at,
            sender: {
              name: messageData.users?.name || 'Unknown',
              username: messageData.users?.username || undefined,
              avatar_url: messageData.users?.avatar_url || '/default-avatar.png',
            },
            media_type: messageData.media_type || undefined,
            media_url: messageData.media_url || undefined,
            mentions: messageData.mentions || undefined,
            reply_to: messageData.reply_to || undefined,
          };

          setMessages((prevMessages) => {
            if (prevMessages.some((msg) => msg.id === newMessage.id)) {
              return prevMessages;
            }
            return [...prevMessages, newMessage];
          });
        }
      )
      .subscribe((status) => {
        console.log(`Event chat subscription status for ${eventId}:`, status);
      });

    return () => {
      subscription.unsubscribe();
    };
  }, [eventId, supabase]);

  return {
    messages,
    sendMessage,
    isLoading
  };
}
