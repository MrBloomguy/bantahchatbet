import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from '../contexts/ToastContext';

interface Notification {
  id: string;
  message: string;
  type: string;
  created_at: string;
  read: boolean;
  event_id: string;
}

export const NotificationsPanel: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    loadNotifications();
    
    // Subscribe to new notifications
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${supabase.auth.user()?.id}`
      }, payload => {
        setNotifications(prev => [payload.new as Notification, ...prev]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', supabase.auth.user()?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error loading notifications:', error);
      toast.showError('Failed to load notifications');
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

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'bet_matched':
        return '🤝';
      case 'payout_processed':
        return '💰';
      case 'creator_earnings':
        return '💎';
      default:
        return '📢';
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 max-h-[80vh] overflow-y-auto">
      <h2 className="text-xl font-bold mb-4 text-white">Notifications</h2>
      
      {loading ? (
        <div className="text-center text-gray-400">Loading notifications...</div>
      ) : notifications.length === 0 ? (
        <div className="text-center text-gray-400">No notifications</div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 rounded-lg transition-all duration-200 ${
                notification.read ? 'bg-gray-700/50' : 'bg-gray-700'
              }`}
              onClick={() => !notification.read && markAsRead(notification.id)}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{getNotificationIcon(notification.type)}</span>
                <div className="flex-1">
                  <p className={`text-sm ${notification.read ? 'text-gray-300' : 'text-white'}`}>
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(notification.created_at).toLocaleString()}
                  </p>
                </div>
                {!notification.read && (
                  <span className="h-2 w-2 rounded-full bg-[#CCFF00]" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};