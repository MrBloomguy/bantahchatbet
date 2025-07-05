
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface EventNotificationData {
  totalEventNotifications: number;
  unreadEventMessages: number;
  newEventsCount: number;
}

export const useEventNotifications = () => {
  const { currentUser } = useAuth();
  const [eventNotifications, setEventNotifications] = useState<EventNotificationData>({
    totalEventNotifications: 0,
    unreadEventMessages: 0,
    newEventsCount: 0
  });

  useEffect(() => {
    if (!currentUser) return;

    const fetchEventNotifications = async () => {
      try {
        // Get new events count (existing logic)
        const { count: newEventsCount } = await supabase
          .from('events')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active')
          .neq('type', 'challenge');

        // Get events the user has joined (either as creator or participant)
        const { data: userEvents } = await supabase
          .from('events')
          .select('id')
          .or(`creator_id.eq.${currentUser.id},id.in.(${
            // Get events where user is a participant
            await supabase
              .from('event_participants')
              .select('event_id')
              .eq('user_id', currentUser.id)
              .then(({ data }) => data?.map(p => p.event_id).join(',') || '')
          })`);

        if (!userEvents || userEvents.length === 0) {
          setEventNotifications({
            totalEventNotifications: newEventsCount || 0,
            unreadEventMessages: 0,
            newEventsCount: newEventsCount || 0
          });
          return;
        }

        const eventIds = userEvents.map(e => e.id);

        // Get unread event messages from all events user has joined
        // We'll consider a message "unread" if it was created after user's last_message_read_at
        // For now, we'll use a simpler approach - messages from the last 24 hours that aren't from the user
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        
        const { count: unreadEventMessages } = await supabase
          .from('event_chat_messages')
          .select('*', { count: 'exact', head: true })
          .in('event_id', eventIds)
          .neq('sender_id', currentUser.id)
          .gte('created_at', oneDayAgo);

        const totalEventNotifications = (newEventsCount || 0) + (unreadEventMessages || 0);

        setEventNotifications({
          totalEventNotifications,
          unreadEventMessages: unreadEventMessages || 0,
          newEventsCount: newEventsCount || 0
        });

      } catch (error) {
        console.error('Error fetching event notifications:', error);
      }
    };

    fetchEventNotifications();

    // Set up real-time subscription for event chat messages
    const eventChatSubscription = supabase
      .channel('event-notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'event_chat_messages'
      }, (payload) => {
        // Only count if message is not from current user
        if (payload.new.sender_id !== currentUser.id) {
          setEventNotifications(prev => ({
            ...prev,
            unreadEventMessages: prev.unreadEventMessages + 1,
            totalEventNotifications: prev.totalEventNotifications + 1
          }));
        }
      })
      .subscribe();

    // Set up real-time subscription for new events
    const eventsSubscription = supabase
      .channel('events-notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'events'
      }, () => {
        fetchEventNotifications();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(eventChatSubscription);
      supabase.removeChannel(eventsSubscription);
    };
  }, [currentUser]);

  const markEventMessagesAsRead = async (eventId: string) => {
    // This would typically update a user's last_read_at timestamp for the specific event
    // For now, we'll just refresh the counts
    if (!currentUser) return;

    try {
      // In a real implementation, you'd update a user_event_read_status table
      // For now, we'll just reduce the unread count optimistically
      setEventNotifications(prev => ({
        ...prev,
        unreadEventMessages: Math.max(0, prev.unreadEventMessages - 1),
        totalEventNotifications: Math.max(0, prev.totalEventNotifications - 1)
      }));
    } catch (error) {
      console.error('Error marking event messages as read:', error);
    }
  };

  return {
    ...eventNotifications,
    markEventMessagesAsRead
  };
};
