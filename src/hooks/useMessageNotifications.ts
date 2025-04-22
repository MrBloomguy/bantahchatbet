import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

// Add sound effect for new messages
const MESSAGE_SOUND = '/message-notification.mp3';

export const useMessageNotifications = () => {
  const { currentUser } = useAuth();
  const toast = useToast();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [notifications, setNotifications] = useState({
    unreadMessages: 0,
    pendingFriendRequests: 0
  });

  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio(MESSAGE_SOUND);
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    // Initial fetch
    fetchNotificationCounts();

    // Set up real-time subscription for new messages
    const messagesChannel = supabase
      .channel('private-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'private_messages',
          filter: `receiver_id=eq.${currentUser.id}`
        },
        (payload) => {
          console.log('New private message received:', payload.new);

          // Immediately update the unread count
          setNotifications(prev => ({
            ...prev,
            unreadMessages: prev.unreadMessages + 1
          }));

          // Also fetch from the server to ensure accuracy
          fetchNotificationCounts();

          // Get sender information
          getSenderInfo(payload.new.sender_id).then(sender => {
            // Play notification sound
            if (audioRef.current) {
              audioRef.current.play().catch(err => console.error('Error playing notification sound:', err));
            }

            // Show rich toast notification with sender info and message preview
            const senderName = sender?.name || sender?.username || 'Someone';
            const messagePreview = payload.new.content.length > 30
              ? `${payload.new.content.substring(0, 30)}...`
              : payload.new.content;

            toast.showInfo(
              `${senderName}: ${messagePreview}`,
              { duration: 5000, onClick: () => navigateToChat(payload.new.sender_id) }
            );

            // Show browser notification if page is not visible
            if (document.visibilityState !== 'visible' && 'Notification' in window) {
              if (Notification.permission === 'granted') {
                new Notification(`Message from ${senderName}`, {
                  body: messagePreview,
                  icon: sender?.avatar_url || '/logo192.png'
                });
              }
            }
          });
        }
      )
      .subscribe((status) => {
        console.log('Private messages subscription status:', status);
      });

    // Set up subscription for friend requests
    const friendRequestsChannel = supabase
      .channel('friend-requests')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'friend_requests',
          filter: `receiver_id=eq.${currentUser.id}`
        },
        (payload) => {
          console.log('New friend request received:', payload.new);

          // Immediately update the pending requests count
          setNotifications(prev => ({
            ...prev,
            pendingFriendRequests: prev.pendingFriendRequests + 1
          }));

          // Also fetch from the server to ensure accuracy
          fetchNotificationCounts();
          toast.showInfo('New friend request received');
        }
      )
      .subscribe((status) => {
        console.log('Friend requests subscription status:', status);
      });

    // Set up subscription for message read status changes
    const messageReadChannel = supabase
      .channel('message-read-status')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'private_messages',
          filter: `receiver_id=eq.${currentUser.id} AND read=eq.true`
        },
        () => {
          // When messages are marked as read, update the count
          fetchNotificationCounts();
        }
      )
      .subscribe();

    // Set up subscription for chat_messages table as well
    const chatMessagesChannel = supabase
      .channel('chat-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages'
        },
        (payload) => {
          // Check if this message is for the current user
          if (payload.new.receiver_id === currentUser.id) {
            console.log('New chat message received:', payload.new);

            // Immediately update the unread count
            setNotifications(prev => ({
              ...prev,
              unreadMessages: prev.unreadMessages + 1
            }));

            // Also fetch from the server to ensure accuracy
            fetchNotificationCounts();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(friendRequestsChannel);
      supabase.removeChannel(messageReadChannel);
      supabase.removeChannel(chatMessagesChannel);
    };
  }, [currentUser, toast]);

  const fetchNotificationCounts = async () => {
    if (!currentUser) return;

    try {
      // Get unread private messages count
      const privateMessagesPromise = supabase
        .from('private_messages')
        .select('id', { count: 'exact' })
        .eq('receiver_id', currentUser.id)
        .eq('read', false);

      // Get unread chat messages count
      const chatMessagesPromise = supabase
        .from('chat_messages')
        .select('id', { count: 'exact' })
        .eq('receiver_id', currentUser.id)
        .eq('read', false);

      // Get pending friend requests count
      const friendRequestsPromise = supabase
        .from('friend_requests')
        .select('id', { count: 'exact' })
        .eq('receiver_id', currentUser.id)
        .eq('status', 'pending');

      // Execute all queries in parallel
      const [privateMessagesResponse, chatMessagesResponse, requestsResponse] =
        await Promise.all([privateMessagesPromise, chatMessagesPromise, friendRequestsPromise]);

      if (!privateMessagesResponse.error && !chatMessagesResponse.error && !requestsResponse.error) {
        const totalUnreadMessages = (privateMessagesResponse.count || 0) + (chatMessagesResponse.count || 0);

        console.log('Unread message counts:', {
          privateMessages: privateMessagesResponse.count || 0,
          chatMessages: chatMessagesResponse.count || 0,
          total: totalUnreadMessages,
          friendRequests: requestsResponse.count || 0
        });

        setNotifications({
          unreadMessages: totalUnreadMessages,
          pendingFriendRequests: requestsResponse.count || 0
        });
      }
    } catch (error) {
      console.error('Error fetching notification counts:', error);
    }
  };

  // Get sender information
  const getSenderInfo = async (senderId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, username, avatar_url')
        .eq('id', senderId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching sender info:', error);
      return null;
    }
  };

  // Navigate to chat with sender
  const navigateToChat = (senderId: string) => {
    // This function will be implemented in the Messages component
    // For now, we'll just navigate to the messages page
    window.location.href = '/messages';
  };

  return notifications;
};
