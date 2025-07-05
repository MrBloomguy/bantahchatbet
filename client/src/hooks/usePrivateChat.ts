import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';

interface PrivateMessage {
  id: string;
  content: string;
  sender_id: string;
  receiver_id: string;
  created_at: string;
  media_url?: string;
  sender?: {
    name: string;
    avatar_url: string | null;
    username: string | null;
  };
}

export function usePrivateChat(receiverId: string) {
  const [messages, setMessages] = useState<PrivateMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { currentUser } = useAuth();
  const toast = useToast();

  const fetchMessages = useCallback(async () => {
    if (!currentUser || !receiverId) return;

    try {
      const { data, error } = await supabase
        .from('private_messages')
        .select(`
          id,
          content,
          sender_id,
          receiver_id,
          created_at,
          media_url,
          sender:users!sender_id(name, avatar_url, username)
        `)
        .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${currentUser.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.showError('Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, receiverId, toast]);

  const sendMessage = useCallback(async (content: string, mediaUrl?: string) => {
    if (!currentUser || !receiverId) {
      toast.showError('Cannot send message');
      return;
    }

    try {
      const { data, error } = await supabase
        .rpc('send_private_message', {
          p_content: content,
          p_sender_id: currentUser.id,
          p_receiver_id: receiverId,
          p_media_url: mediaUrl,
          p_notification_type: 'direct_message'
        });

      if (error) throw error;

      // Fetch the message with sender information
      const { data: messageWithSender, error: fetchError } = await supabase
        .from('private_messages')
        .select(`
          *,
          sender:users!sender_id(name, avatar_url, username)
        `)
        .eq('id', data[0].id)
        .single();

      if (fetchError) throw fetchError;

      setMessages(prev => [...prev, messageWithSender]);
      return messageWithSender;
    } catch (error) {
      console.error('Error sending message:', error);
      toast.showError('Failed to send message');
    }
  }, [currentUser, receiverId, toast]);

  useEffect(() => {
    if (!currentUser || !receiverId) return;

    const subscription = supabase
      .from('private_messages')
      .on('INSERT', (payload) => {
        if (
          (payload.new.sender_id === currentUser.id && payload.new.receiver_id === receiverId) ||
          (payload.new.sender_id === receiverId && payload.new.receiver_id === currentUser.id)
        ) {
          setMessages(prev => [...prev, payload.new]);
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [currentUser, receiverId]);

  return {
    messages,
    sendMessage,
    isLoading,
    fetchMessages
  };
}
