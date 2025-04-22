import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';

interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
  user?: {
    name: string;
    avatar_url: string;
    username: string;
  };
}

interface ChatMessage {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  chat_id: string;
  sender?: {
    name: string;
    avatar_url: string;
    username: string;
  };
  reactions?: MessageReaction[];
}

interface Chat {
  id: string;
  created_at: string;
  updated_at: string;
  last_message?: ChatMessage;
  unread_count?: number;
  participants: Array<{
    user_id: string;
    name?: string;
    avatar_url?: string;
    username?: string;
  }>;
}

export function useChat(chatId?: string) {
  const { currentUser } = useAuth();
  const toast = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [chats, setChats] = useState<Chat[]>([]);

  // Fetch messages for a specific chat and mark them as read
  const fetchMessages = useCallback(async () => {
    if (!chatId || !currentUser) return;

    try {
      // Fetch messages
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          id,
          content,
          created_at,
          sender_id,
          chat_id,
          read,
          sender:users!sender_id (
            id,
            name,
            avatar_url,
            username
          ),
          reactions:message_reactions (
            id,
            emoji,
            user_id,
            user:users (
              name,
              avatar_url,
              username
            )
          )
        `)
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);

      // Mark unread messages as read
      const unreadMessages = data?.filter(msg =>
        !msg.read && msg.sender_id !== currentUser.id
      ) || [];

      if (unreadMessages.length > 0) {
        console.log(`Marking ${unreadMessages.length} messages as read`);
        const unreadIds = unreadMessages.map(msg => msg.id);

        const { error: updateError } = await supabase
          .from('chat_messages')
          .update({ read: true })
          .in('id', unreadIds);

        if (updateError) {
          console.error('Error marking messages as read:', updateError);
        } else {
          // Refresh chat list to update unread counts
          fetchChats();
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.showError('Failed to load messages');
    }
  }, [chatId, currentUser, fetchChats]);

  const fetchChats = useCallback(async () => {
    if (!currentUser) {
      setLoading(false);
      return [];
    }

    try {
      setLoading(true);

      // First, get unread message counts for each chat
      const { data: unreadCounts, error: unreadError } = await supabase
        .from('chat_messages')
        .select('chat_id, count(*)')
        .eq('read', false)
        .neq('sender_id', currentUser.id)
        .in('chat_id', (
          supabase
            .from('chat_participants')
            .select('chat_id')
            .eq('user_id', currentUser.id)
        ))
        .group('chat_id');

      if (unreadError) {
        console.error('Error fetching unread counts:', unreadError);
      }

      // Create a map of chat_id to unread count
      const unreadCountMap = (unreadCounts || []).reduce((acc, item) => {
        acc[item.chat_id] = parseInt(item.count);
        return acc;
      }, {});

      // Then get the chats with participants and last message
      const { data: userChats, error: chatsError } = await supabase
        .from('chats')
        .select(`
          id,
          created_at,
          updated_at,
          participants:chat_participants(
            user_id,
            users(
              id,
              name,
              avatar_url,
              username
            )
          ),
          last_message:chat_messages(
            id,
            content,
            created_at,
            sender_id,
            read
          )
        `)
        .eq('chat_participants.user_id', currentUser.id)
        .order('updated_at', { ascending: false });

      if (chatsError) throw chatsError;

      const chatsWithMessages = userChats.map(chat => ({
        id: chat.id,
        created_at: chat.created_at,
        updated_at: chat.updated_at,
        last_message: chat.last_message?.[0],
        unread_count: unreadCountMap[chat.id] || 0,
        participants: chat.participants.map(p => ({
          user_id: p.users.id,
          name: p.users.name,
          avatar_url: p.users.avatar_url,
          username: p.users.username
        }))
      }));

      setChats(chatsWithMessages);
      return chatsWithMessages;
    } catch (error) {
      console.error('Error fetching chats:', error);
      toast.showError('Failed to load chats');
      return [];
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const sendMessage = useCallback(async (content: string) => {
    if (!currentUser || !chatId) {
      toast.showError('Cannot send message');
      return;
    }

    try {
      // Start a Supabase transaction
      const { data: message, error: messageError } = await supabase
        .rpc('send_chat_message', {
          p_content: content,
          p_chat_id: chatId,
          p_sender_id: currentUser.id,
          p_notification_type: 'chat_message' // Add notification type
        })
        .select(`
          id,
          content,
          created_at,
          sender_id,
          chat_id,
          sender:users!sender_id (
            id,
            name,
            avatar_url,
            username
          )
        `)
        .single();

      if (messageError) throw messageError;

      // Add message to local state
      setMessages(prev => [...prev, message]);

      // Refresh chat list to update last message
      fetchChats();

      return message;
    } catch (error) {
      console.error('Error sending message:', error);
      toast.showError('Failed to send message');
    }
  }, [currentUser, chatId, fetchChats]);

  const toggleReaction = useCallback(async (messageId: string, emoji: string) => {
    if (!currentUser) return;

    try {
      const { data: existingReaction } = await supabase
        .from('message_reactions')
        .select('id')
        .match({
          message_id: messageId,
          user_id: currentUser.id,
          emoji: emoji
        })
        .single();

      if (existingReaction) {
        await supabase
          .from('message_reactions')
          .delete()
          .match({ id: existingReaction.id });

        setMessages(prev =>
          prev.map(message =>
            message.id === messageId
              ? {
                  ...message,
                  reactions: message.reactions?.filter(r => r.id !== existingReaction.id)
                }
              : message
          )
        );
      } else {
        const { data: newReaction, error } = await supabase
          .from('message_reactions')
          .insert({
            message_id: messageId,
            user_id: currentUser.id,
            emoji: emoji
          })
          .select(`
            id,
            emoji,
            user_id,
            user:users (
              name,
              avatar_url,
              username
            )
          `)
          .single();

        if (error) throw error;

        setMessages(prev =>
          prev.map(message =>
            message.id === messageId
              ? {
                  ...message,
                  reactions: [...(message.reactions || []), newReaction]
                }
              : message
          )
        );
      }
    } catch (error) {
      console.error('Error toggling reaction:', error);
      toast.showError('Failed to update reaction');
    }
  }, [currentUser]);

  // Initial fetch of chats
  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  // Subscribe to chat updates (new messages in any chat)
  useEffect(() => {
    if (!currentUser) return;

    // Subscribe to new messages in any chat the user is part of
    const chatUpdatesSubscription = supabase
      .channel('chat-updates')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages'
      }, async payload => {
        // Check if this message is in a chat the user is part of
        const { data: isParticipant } = await supabase
          .from('chat_participants')
          .select('user_id')
          .eq('chat_id', payload.new.chat_id)
          .eq('user_id', currentUser.id)
          .single();

        if (isParticipant) {
          // Refresh the chat list to update the last message
          fetchChats();
        }
      })
      .subscribe();

    return () => {
      chatUpdatesSubscription.unsubscribe();
    };
  }, [currentUser, fetchChats]);

  // Fetch messages when chatId changes
  useEffect(() => {
    if (chatId) {
      fetchMessages();
    }
  }, [chatId, fetchMessages]);

  // Subscribe to new messages and chat updates
  useEffect(() => {
    if (!chatId || !currentUser) return;

    console.log(`Subscribing to messages for chat: ${chatId}`);

    // Subscribe to new messages in the current chat
    const messageSubscription = supabase
      .channel(`chat:${chatId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `chat_id=eq.${chatId}`
      }, async payload => {
        console.log('New message received via subscription:', payload.new);

        // Immediately add a basic version of the message to the UI
        const tempMessage = {
          ...payload.new,
          sender: payload.new.sender_id === currentUser.id ? currentUser : null
        };

        setMessages(prev => [...prev, tempMessage]);

        // Mark the message as read if it's not from the current user
        if (payload.new.sender_id !== currentUser.id) {
          console.log('Marking new message as read:', payload.new.id);
          const { error: readError } = await supabase
            .from('chat_messages')
            .update({ read: true })
            .eq('id', payload.new.id);

          if (readError) {
            console.error('Error marking message as read:', readError);
          } else {
            // Refresh chat list to update unread counts
            fetchChats();
          }
        }

        // Then fetch the complete message with sender info
        try {
          const { data: messageWithSender, error } = await supabase
            .from('chat_messages')
            .select(`
              id,
              content,
              created_at,
              sender_id,
              chat_id,
              read,
              sender:users!sender_id (
                id,
                name,
                avatar_url,
                username
              )
            `)
            .eq('id', payload.new.id)
            .single();

          if (error) throw error;

          if (messageWithSender) {
            console.log('Fetched complete message with sender:', messageWithSender);
            // Replace the temporary message with the complete one
            setMessages(prev => prev.map(msg =>
              msg.id === messageWithSender.id ? messageWithSender : msg
            ));
          }
        } catch (error) {
          console.error('Error fetching complete message:', error);
        }
      })
      .subscribe((status) => {
        console.log(`Subscription status for chat ${chatId}:`, status);
      });

    // Subscribe to message reactions
    const reactionSubscription = supabase
      .channel(`reactions:${chatId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'message_reactions',
        filter: `message_id=in.(select id from chat_messages where chat_id='${chatId}')`
      }, async payload => {
        // Fetch the complete reaction with user info
        const { data: reactionWithUser } = await supabase
          .from('message_reactions')
          .select(`
            id,
            emoji,
            user_id,
            message_id,
            user:users (
              name,
              avatar_url,
              username
            )
          `)
          .eq('id', payload.new.id)
          .single();

        if (reactionWithUser) {
          // Update the message with the new reaction
          setMessages(prev =>
            prev.map(message =>
              message.id === reactionWithUser.message_id
                ? {
                    ...message,
                    reactions: [...(message.reactions || []), reactionWithUser]
                  }
                : message
            )
          );
        }
      })
      .subscribe();

    // Subscribe to reaction deletions
    const reactionDeleteSubscription = supabase
      .channel(`reaction-delete:${chatId}`)
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'message_reactions',
        filter: `message_id=in.(select id from chat_messages where chat_id='${chatId}')`
      }, payload => {
        // Update messages to remove the deleted reaction
        setMessages(prev =>
          prev.map(message =>
            message.reactions?.some(r => r.id === payload.old.id)
              ? {
                  ...message,
                  reactions: message.reactions.filter(r => r.id !== payload.old.id)
                }
              : message
          )
        );
      })
      .subscribe();

    return () => {
      messageSubscription.unsubscribe();
      reactionSubscription.unsubscribe();
      reactionDeleteSubscription.unsubscribe();
    };
  }, [chatId, currentUser]);

  return {
    messages,
    sendMessage,
    loading,
    fetchChats,
    chats,
    toggleReaction,
    refreshMessages: fetchMessages,
    refreshChats: fetchChats
  };
}
