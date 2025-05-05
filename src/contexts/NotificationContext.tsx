import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from './ToastContext';

// Service worker registration status
let swRegistration: ServiceWorkerRegistration | null = null;
let isSubscribed = false;

interface NotificationContextType {
  unreadCount: number;
  markAllAsRead: () => Promise<void>;
  isPushSupported: boolean;
  isPushEnabled: boolean;
  subscribeToPush: () => Promise<void>;
  unsubscribeFromPush: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType>({
  unreadCount: 0,
  markAllAsRead: async () => {},
  isPushSupported: false,
  isPushEnabled: false,
  subscribeToPush: async () => {},
  unsubscribeFromPush: async () => {},
});

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isPushSupported, setIsPushSupported] = useState(false);
  const [isPushEnabled, setIsPushEnabled] = useState(false);
  const toast = useToast();

  const loadUnreadCount = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) throw error;
      setUnreadCount(count || 0);
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) throw error;
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      toast.showError('Failed to mark notifications as read');
    }
  };

  useEffect(() => {
    const processedNotifications = new Set(); // Track processed notifications

    const fetchUserAndSubscribe = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      loadUnreadCount();

      // Subscribe to new notifications
      const channel = supabase
        .channel('notifications-context')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        }, (payload) => {
          const notification = payload.new;

          // Avoid duplicate toasts for the same notification ID
          if (processedNotifications.has(notification.id)) return;
          processedNotifications.add(notification.id);

          console.log('New notification in context:', notification);
          setUnreadCount(prev => prev + 1);
          toast.showInfo(notification.title || 'New notification received');
        })
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        }, () => {
          loadUnreadCount();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    fetchUserAndSubscribe();
  }, [toast]);

  // Check if push notifications are supported
  useEffect(() => {
    // Check if service workers and push messaging are supported by the browser
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsPushSupported(true);

      // Register service worker
      navigator.serviceWorker.register('/service-worker.js')
        .then(registration => {
          console.log('Service Worker registered with scope:', registration.scope);
          swRegistration = registration;

          // Check if already subscribed
          return registration.pushManager.getSubscription();
        })
        .then(subscription => {
          isSubscribed = !(subscription === null);
          setIsPushEnabled(isSubscribed);

          if (isSubscribed) {
            console.log('User is already subscribed to push notifications');
            // You could update your backend with the subscription here
          }
        })
        .catch(error => {
          console.error('Service Worker registration failed:', error);
        });
    }
  }, []);

  // Function to subscribe to push notifications
  const subscribeToPush = async () => {
    if (!swRegistration) return;

    try {
      const applicationServerKey = urlBase64ToUint8Array(
        'BMRTg6RSFC44oDE9Nf7drNX-cqAKhvCfHwbzVmuSE9VEMcjTJ9QclzWFBjZo_Kfz7psQ6KPTorG04XgF75QKMPY'
      );

      const subscription = await swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey
      });

      console.log('User is subscribed:', subscription);

      // Send the subscription to your server
      await saveSubscription(subscription);

      isSubscribed = true;
      setIsPushEnabled(true);
      toast.showSuccess('Push notifications enabled!');
    } catch (error) {
      console.error('Failed to subscribe the user:', error);
      toast.showError('Could not enable push notifications');
    }
  };

  // Function to unsubscribe from push notifications
  const unsubscribeFromPush = async () => {
    if (!swRegistration) return;

    try {
      const subscription = await swRegistration.pushManager.getSubscription();

      if (subscription) {
        // Remove subscription from server
        await deleteSubscription();

        // Unsubscribe locally
        await subscription.unsubscribe();

        isSubscribed = false;
        setIsPushEnabled(false);
        toast.showSuccess('Push notifications disabled!');
      }
    } catch (error) {
      console.error('Error unsubscribing:', error);
      toast.showError('Could not disable push notifications');
    }
  };

  // Helper function to convert base64 to Uint8Array for VAPID key
  const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
  };

  // Save subscription to your backend
  const saveSubscription = async (subscription: PushSubscription) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Store the subscription in your database
      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: user.id,
          subscription: JSON.stringify(subscription),
          created_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving subscription:', error);
      throw error;
    }
  };

  // Delete subscription from your backend
  const deleteSubscription = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting subscription:', error);
      throw error;
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        unreadCount,
        markAllAsRead,
        isPushSupported,
        isPushEnabled,
        subscribeToPush,
        unsubscribeFromPush
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};