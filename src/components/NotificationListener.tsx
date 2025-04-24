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

    // Set up Supabase Realtime subscription for notifications
    const notificationChannel = supabase
      .channel('user-notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${currentUser.id}`
      }, (payload) => {
        console.log('New notification received via Supabase Realtime:', payload);
        
        // Show toast notification based on type
        const notification = payload.new;
        
        // Special handling for challenge notifications
        if (notification.notification_type?.includes('challenge_')) {
          const title = notification.title || 'New Challenge Notification';
          const content = notification.content || '';
          
          // Use different toast styles based on notification type
          if (notification.notification_type === 'challenge_received') {
            toast.showInfo(title, { 
              description: content,
              duration: 8000, // Show longer for important notifications
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

    // Set up BroadcastChannel for even faster in-app notifications
    let broadcastChannel: BroadcastChannel | null = null;
    
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        broadcastChannel = new BroadcastChannel('bantahchatbet-notifications');
        
        broadcastChannel.onmessage = (event) => {
          const { userId, notification } = event.data;
          
          // Only process if this notification is for the current user
          if (userId === currentUser.id) {
            console.log('Instant notification received via BroadcastChannel:', notification);
            
            // Show toast notification
            if (notification.type?.includes('challenge_')) {
              const title = notification.title || 'New Challenge Notification';
              
              if (notification.type === 'challenge_received') {
                // Play sound for new challenge notifications
                const audio = new Audio('/notification-sound.mp3');
                audio.play().catch(e => console.warn('Could not play notification sound', e));
                
                toast.showInfo(title, { 
                  description: notification.content,
                  duration: 8000,
                  action: {
                    label: 'View',
                    onClick: () => {
                      window.location.href = `/messages?tab=challenges&chatId=${notification.metadata?.challenge_id}`;
                    }
                  }
                });
              }
            }
          }
        };
      }
    } catch (error) {
      console.warn('BroadcastChannel not supported:', error);
    }

    // Cleanup function
    return () => {
      supabase.removeChannel(notificationChannel);
      
      if (broadcastChannel) {
        broadcastChannel.close();
      }
    };
  }, [currentUser, toast]);

  // This component doesn't render anything
  return null;
};

export default NotificationListener;
