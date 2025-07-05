import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface SupportMessage {
  id: string;
  content: string;
  created_at: string;
  is_support: boolean;
  read: boolean;
  read_at?: string;
  user_id: string;
  user_name?: string;
  user_avatar_url?: string;
}

export const useSupport = () => {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch messages (no join, just support_messages)
  const fetchMessages = useCallback(async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('support_messages')
        .select('*')
        .or(`user_id.eq.${currentUser.id},is_support.eq.true`)
        .order('created_at', { ascending: true });
      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching support messages:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  // Send a message (store user_name/avatar for display, no join needed)
  const sendMessage = async (content: string) => {
    if (!currentUser) return;
    try {
      const { error } = await supabase
        .from('support_messages')
        .insert([{
          user_id: currentUser.id,
          content,
          is_support: false,
          user_name: currentUser.user_metadata?.name || currentUser.email || 'User',
          user_avatar_url: currentUser.user_metadata?.avatar_url || null
        }]);
      if (error) throw error;
      await fetchMessages();
    } catch (error) {
      console.error('Error sending support message:', error);
      throw error;
    }
  };

  // Subscribe to new messages
  useEffect(() => {
    if (!currentUser) return;
    const channel = supabase.channel(`support-${currentUser.id}`);
    channel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_messages',
          filter: `user_id=eq.${currentUser.id}`
        },
        async () => {
          await fetchMessages();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to support messages');
        }
      });
    fetchMessages();
    return () => {
      channel.unsubscribe();
    };
  }, [currentUser, fetchMessages]);

  // Mark messages as read
  useEffect(() => {
    if (!currentUser || messages.length === 0) return;
    const markMessagesAsRead = async () => {
      const unreadMessages = messages.filter(
        msg => !msg.read && msg.is_support && msg.user_id === currentUser.id
      );
      if (unreadMessages.length === 0) return;
      const { error } = await supabase
        .from('support_messages')
        .update({ read: true, read_at: new Date().toISOString() })
        .in('id', unreadMessages.map(msg => msg.id));
      if (error) {
        console.error('Error marking messages as read:', error);
      }
    };
    markMessagesAsRead();
  }, [currentUser, messages]);

  return {
    messages,
    loading,
    sendMessage,
  };
};
