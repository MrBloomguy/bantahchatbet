import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

export function useNotification() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const { currentUser } = useAuth();
  const toast = useToast();

  const fetchNotifications = useCallback(async () => {
    if (!currentUser?.id) return;

    try {
      setLoading(true);

      // Add error handling and retry logic
      let retries = 3;
      let error;

      while (retries > 0) {
        try {
          const { data, error: fetchError } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false })

          if (fetchError) throw fetchError;

          setUnreadCount(data?.filter(n => !n.read_at).length || 0);

          setNotifications(data || []);
          return; // Success, exit the retry loop
        } catch (e) {
          error = e;
          retries--;
          if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s before retry
          }
        }
      }

      // If we get here, all retries failed
      throw error;

    } catch (error) {
      console.error('Error in fetchNotifications:', error);
      toast.showError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id, toast]);

    const markAsRead = useCallback(async (notificationId: string) => {
        if (!currentUser?.id) return;

        try {
          const { error } = await supabase
            .from('notifications')
            .update({ read_at: new Date() })
            .eq('id', notificationId)
            .eq('user_id', currentUser.id);

          if (error) throw error;

          // Update local state
          setNotifications(notifications.map(n =>
            n.id === notificationId ? { ...n, read_at: new Date() } : n
          ));
          setUnreadCount(unreadCount - 1);
          toast.showSuccess('Notification marked as read');
        } catch (error) {
          console.error('Error marking notification as read:', error);
          toast.showError('Failed to mark notification as read');
        }
      }, [currentUser?.id, notifications, unreadCount, toast]);

      const markAllAsRead = useCallback(async () => {
        if (!currentUser?.id) return;

        try {
          const { error } = await supabase
            .from('notifications')
            .update({ read_at: new Date() })
            .eq('user_id', currentUser.id)
            .is('read_at', null);

          if (error) throw error;

          // Update local state
          setNotifications(notifications.map(n => ({ ...n, read_at: new Date() })));
          setUnreadCount(0);
          toast.showSuccess('All notifications marked as read');
        } catch (error) {
          console.error('Error marking all notifications as read:', error);
          toast.showError('Failed to mark notifications as read');
        }
      }, [currentUser?.id, notifications, toast]);

  useEffect(() => {
    fetchNotifications();

    // Set up real-time subscription for new notifications
    if (!currentUser?.id) return;

    // Create a channel for real-time updates
    const channel = supabase
      .channel('notification-changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${currentUser.id}`
      }, (payload) => {
        console.log('New notification received:', payload);
        // Add the new notification to the state
        setNotifications(prev => [payload.new, ...prev]);
        // Update unread count
        setUnreadCount(prev => prev + 1);
        // Show a toast notification
        toast.showInfo(payload.new.title || 'New notification received');
      })
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchNotifications, currentUser?.id, toast]);

  return {
        notifications,
        unreadCount,
        loading,
        refetchNotifications: fetchNotifications,
        markAsRead,
        markAllAsRead,
      };
    }
