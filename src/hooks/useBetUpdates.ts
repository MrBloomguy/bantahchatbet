import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

type BetStatus = 'waiting' | 'matched' | 'completed';

export const useBetUpdates = (participantId: string): BetStatus => {
  const [status, setStatus] = useState<BetStatus>('waiting');

  useEffect(() => {
    if (!participantId) return;

    // Initial status check
    const checkStatus = async () => {
      const { data, error } = await supabase
        .from('event_participants')
        .select('status, matched_at')
        .eq('id', participantId)
        .single();

      if (error) {
        console.error('Error checking bet status:', error);
        return;
      }

      if (data.matched_at) {
        setStatus('matched');
      } else if (data.status === 'completed') {
        setStatus('completed');
      } else {
        setStatus('waiting');
      }
    };

    checkStatus();

    // Subscribe to real-time updates
    const subscription = supabase
      .channel(`participant-${participantId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'event_participants',
          filter: `id=eq.${participantId}`
        },
        (payload) => {
          const { new: newData } = payload;
          if (newData.matched_at) {
            setStatus('matched');
          } else if (newData.status === 'completed') {
            setStatus('completed');
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [participantId]);

  return status;
};