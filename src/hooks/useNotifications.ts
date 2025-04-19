import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from '../contexts/ToastContext';

interface Notification {
  id: string;
  user_id: string;
  type: 'bet_matched' | 'bet_completed' | 'system';
  message: string;
  read: boolean;
  created_at: string;
  metadata?: Record<string, any>;
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const user = supabase.auth.user();
    if (!user) return;

    // Load initial notifications
    loadNotifications();

    // Subscribe to new notifications
    const subscription = supabase
      .from(`notifications:user_id=eq.${user.id}`)
      .on('INSERT', (payload) => {
        setNotifications(prev => [payload.new as Notification, ...prev]);
        
        // Show toast for new notifications
        if (payload.new.type === 'bet_matched') {
          toast.showSuccess('Your bet has been matched!');
        }
      })
      .subscribe();

    return () => {
      supabase.removeSubscription(subscription);
    };
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const user = supabase.auth.user();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setNotifications(data);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const user = supabase.auth.user();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true }))
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const getUnreadCount = () => {
    return notifications.filter(n => !n.read).length;
  };

  return {
    notifications,
    loading,
    markAsRead,
    markAllAsRead,
    getUnreadCount,
    refresh: loadNotifications
  };
};