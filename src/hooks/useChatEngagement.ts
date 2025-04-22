import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { EventHistoryItem } from './useEventHistory';

export function useChatEngagement() {
  const [engagedEvents, setEngagedEvents] = useState<EventHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();
  const toast = useToast();

  const fetchEngagedEvents = useCallback(async () => {
    if (!currentUser?.id) return;

    try {
      setLoading(true);

      // Find events where the user has sent chat messages but hasn't placed a bet
      const { data: chatEvents, error: chatError } = await supabase
        .from('event_chat_messages')
        .select(`
          event_id,
          event:event_id (
            id,
            title,
            description,
            category,
            start_time,
            end_time,
            status,
            creator_id,
            banner_url,
            pool:event_pools (
              total_amount
            ),
            creator:creator_id (
              id,
              username,
              avatar_url
            ),
            participant_count:event_participants(count)
          )
        `)
        .eq('sender_id', currentUser.id)
        .not('event_id', 'is', null);

      if (chatError) throw chatError;

      // Get list of events where user is a participant (has placed a bet)
      const { data: participatedEvents, error: participatedError } = await supabase
        .from('event_participants')
        .select('event_id')
        .eq('user_id', currentUser.id);

      if (participatedError) throw participatedError;

      // Filter out events where the user is already a participant
      const participatedEventIds = (participatedEvents || []).map(p => p.event_id);
      
      // Process the events
      const processedEvents = (chatEvents || [])
        .filter(item => !participatedEventIds.includes(item.event_id))
        .map(({ event }) => {
          if (!event) return null;
          
          return {
            ...event,
            is_editable: false,
            pool_amount: event.pool?.total_amount || 0,
            participant_count: event.participant_count || 0,
            engagement_type: 'chat'
          };
        })
        .filter(Boolean); // Remove null entries

      setEngagedEvents(processedEvents);
    } catch (error) {
      console.error('Error fetching engaged events:', error);
      toast.showError('Failed to load engaged events');
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id, toast]);

  useEffect(() => {
    fetchEngagedEvents();
  }, [fetchEngagedEvents]);

  // Subscribe to real-time updates for chat messages
  useEffect(() => {
    if (!currentUser?.id) return;

    const subscription = supabase
      .channel('chat-updates')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'event_chat_messages',
        filter: `sender_id=eq.${currentUser.id}`
      }, () => {
        fetchEngagedEvents();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [currentUser?.id, fetchEngagedEvents]);

  return {
    engagedEvents,
    loading,
    refetchEngagedEvents: fetchEngagedEvents
  };
}
