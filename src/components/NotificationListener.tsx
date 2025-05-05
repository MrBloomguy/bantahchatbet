import React, { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

/**
 * Component that listens for real-time notifications
 * This component doesn't render anything but sets up listeners
 * for instant notification delivery
 */
const NotificationListener: React.FC = () => {
  const { currentUser } = useAuth();
  const toast = useToast();

  useEffect(() => {
    if (!currentUser) return;

    // Use a Set to track processed notification IDs
    const processedNotifications = new Set();

    // Set up Supabase Realtime subscription for notifications
    const notificationChannel = supabase
      .channel('user-notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${currentUser.id}`
      }, (payload) => {
        const notification = payload.new;

        // Avoid duplicate toasts for the same notification ID
        if (processedNotifications.has(notification.id)) {
          console.log('Duplicate notification prevented:', notification.id);
          return;
        }
        processedNotifications.add(notification.id);

        console.log('Processing notification:', notification.id);
        
        // Show toast notification based on type
        const title = notification.title || 'New Notification';
        const content = notification.content || '';

        if (notification.type === 'system' || notification.type === 'broadcast') {
          toast.showInfo(title, { description: content });
        } else if (notification.notification_type?.includes('challenge_')) {
          // Special handling for challenge notifications
          if (notification.notification_type === 'challenge_received') {
            toast.showInfo(title, { 
              description: content,
              duration: 8000,
              action: {
                label: 'View',
                onClick: () => {
                  window.location.href = `/messages?tab=challenges&chatId=${notification.metadata?.challenge_id}`;
                }
              }
            });
          } else if (notification.notification_type === 'challenge_accepted') {
            toast.showSuccess(title, { description: content });
          } else if (notification.notification_type === 'challenge_declined') {
            toast.showError(title, { description: content });
          } else {
            toast.showInfo(title, { description: content });
          }
        }
      })
      .subscribe();

    // Cleanup function
    return () => {
      supabase.removeChannel(notificationChannel);
    };
  }, [currentUser, toast]);

  // This component doesn't render anything
  return null;
};

export default NotificationListener;
