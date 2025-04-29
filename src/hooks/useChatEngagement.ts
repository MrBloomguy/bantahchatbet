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

      // Get distinct event IDs where the user has sent messages
      const { data: distinctEventIds, error: distinctError } = await supabase
        .from('event_chat_messages')
        .select('event_id')
        .eq('sender_id', currentUser.id)
        .not('event_id', 'is', null);

      if (distinctError) throw distinctError;

      // Get unique event IDs
      const uniqueEventIds = [...new Set((distinctEventIds || []).map(item => item.event_id))];

      // Get full event details for these IDs
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select(`
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
        `)
        .in('id', uniqueEventIds);

      if (eventsError) throw eventsError;

      // Get list of events where user is a participant
      const { data: participatedEvents, error: participatedError } = await supabase
        .from('event_participants')
        .select('event_id')
        .eq('user_id', currentUser.id);

      if (participatedError) throw participatedError;

      // Filter out events where the user is already a participant
      const participatedEventIds = (participatedEvents || []).map(p => p.event_id);
      
      // Process the events
      const processedEvents = (events || [])
        .filter(event => !participatedEventIds.includes(event.id))
        .map((event) => ({
          ...event,
          is_editable: false,
          pool_amount: event.pool?.[0]?.total_amount || 0,
          participant_count: typeof event.participant_count === 'number' 
            ? event.participant_count 
            : event.participant_count?.[0]?.count || 0,
          engagement_type: 'chat',
          creator: event.creator?.[0] || {
            id: '',
            username: '',
            avatar_url: ''
          }
        }));

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
