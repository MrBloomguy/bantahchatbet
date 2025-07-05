import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

export interface EventHistoryItem {
  id: string;
  title: string;
  description: string;
  category: string;
  start_time: string;
  end_time: string;
  status: 'active' | 'completed' | 'cancelled';
  participant_count: number;
  is_editable: boolean;
  banner_url: string;
  pool_amount: number;
  user_prediction?: boolean;
  user_earnings?: number;
  creator: {
    id: string;
    username: string;
    avatar_url: string;
  };
}

export function useEventHistory() {
  const [history, setHistory] = useState<EventHistoryItem[]>([]);
  const [createdEvents, setCreatedEvents] = useState<EventHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();
  const toast = useToast();

  const fetchEvents = useCallback(async () => {
    if (!currentUser?.id) return;

    try {
      setLoading(true);

      // Fetch events where user is a participant with predictions
      // Use a left join to include events that might have been deleted
      const { data: participatedEvents, error: participatedError } = await supabase
        .from('event_participants')
        .select(`
          id,
          event_id,
          prediction,
          event:events (
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
        .eq('user_id', currentUser.id);

      if (participatedError) throw participatedError;

      // Fetch events created by the user
      const { data: createdEventsData, error: createdError } = await supabase
        .from('events')
        .select(`
          id,
          title,
          description,
          category,
          start_time,
          end_time,
          status,
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
        .eq('creator_id', currentUser.id);

      if (createdError) throw createdError;

      // Process the events to include is_editable flag and format the data
      const processedCreatedEvents = (createdEventsData || []).map(event => ({
        ...event,
        is_editable: true,
        pool_amount: event.pool?.total_amount || 0,
        participant_count: event.participant_count || 0
      }));

      const processedParticipatedEvents = (participatedEvents || [])
        .map(({ event, prediction }) => {
          // Skip if event is null (might have been deleted)
          if (!event) {
            return null;
          }

          return {
            ...event,
            is_editable: false,
            pool_amount: event.pool?.total_amount || 0,
            participant_count: event.participant_count || 0,
            user_prediction: prediction,
            // Calculate earnings based on prediction and pool amount if needed
            user_earnings: 0 // You can implement earnings calculation logic here
          };
        })
        .filter(Boolean); // Remove null entries

      setCreatedEvents(processedCreatedEvents);
      setHistory(processedParticipatedEvents);

    } catch (error) {
      console.error('Error fetching event history:', error);
      toast.showError('Failed to load event history');
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id, toast]);

  const editEvent = async (eventId: string, updates: Partial<EventHistoryItem>) => {
    if (!currentUser?.id) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('events')
      .update(updates)
      .eq('id', eventId)
      .eq('creator_id', currentUser.id)
      .single();

    if (error) throw error;

    // Update local state
    setCreatedEvents(prev =>
      prev.map(event =>
        event.id === eventId ? { ...event, ...updates } : event
      )
    );

    return data;
  };

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!currentUser?.id) return;

    const subscription = supabase
      .channel('event-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'events',
        filter: `creator_id=eq.${currentUser.id}`
      }, () => {
        fetchEvents();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [currentUser?.id, fetchEvents]);

  return {
    history,
    createdEvents,
    loading,
    editEvent,
    refetchEvents: fetchEvents  // Expose fetchEvents as refetchEvents
  };
}
