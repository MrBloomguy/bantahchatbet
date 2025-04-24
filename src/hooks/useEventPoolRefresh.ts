import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

interface EventPool {
  total_amount: number;
  admin_liquidity?: number;
  yes_pool?: number;
  no_pool?: number;
}

export const useEventPoolRefresh = (eventId: string) => {
  const [poolData, setPoolData] = useState<EventPool | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchPoolData = useCallback(async () => {
    if (!eventId) return;
    
    setLoading(true);
    try {
      // Get event pool details - don't use single() since there might be multiple records
      const { data: poolDataArray, error: poolError } = await supabase
        .from('event_pools')
        .select('*')
        .eq('event_id', eventId);

      if (poolError) {
        throw poolError;
      }

      if (poolDataArray && poolDataArray.length > 0) {
        // Use the most recent pool record
        const latestPool = poolDataArray[poolDataArray.length - 1];
        setPoolData(latestPool);
      } else {
        setPoolData(null);
      }
    } catch (err) {
      console.error('Error fetching pool data:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchPoolData();
    
    // Set up a real-time subscription to pool updates
    const subscription = supabase
      .channel(`event_pool_${eventId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'event_pools',
        filter: `event_id=eq.${eventId}`
      }, () => {
        // Refresh the pool data when changes occur
        fetchPoolData();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [eventId, fetchPoolData]);

  return { poolData, loading, error, refreshPool: fetchPoolData };
};
