import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export function useDailyClaim() {
  const [lastClaimedDate, setLastClaimedDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { currentUser } = useAuth();

  // Check if user has claimed today
  const checkDailyClaim = useCallback(async () => {
    if (!currentUser) return;
    const { data, error } = await supabase
      .from('daily_points_claims')
      .select('claimed_at')
      .eq('user_id', currentUser.id)
      .order('claimed_at', { ascending: false })
      .limit(1);
    if (!error && data && data.length > 0) {
      setLastClaimedDate(data[0].claimed_at);
    } else {
      setLastClaimedDate(null);
    }
  }, [currentUser]);

  useEffect(() => { checkDailyClaim(); }, [checkDailyClaim]);

  // Claim daily points
  const claimDailyPoints = useCallback(async () => {
    setLoading(true);
    try {
      if (!currentUser) return { success: false, message: 'Not logged in' };
      const today = new Date().toISOString().slice(0, 10);
      if (lastClaimedDate && lastClaimedDate.slice(0, 10) === today) {
        return { success: false, message: 'Already claimed today' };
      }
      // Insert claim record
      const { error: claimError } = await supabase
        .from('daily_points_claims')
        .insert([{ user_id: currentUser.id, claimed_at: new Date().toISOString() }]);
      if (claimError) {
        return { success: false, message: 'Error claiming points: ' + (claimError.message || JSON.stringify(claimError)) };
      }
      // Award points
      const { error: pointsError } = await supabase.rpc('award_points', {
        p_user_id: currentUser.id,
        p_points: 500,
        p_action_type: 'daily_login',
        p_description: 'Daily login bonus',
        p_metadata: {}
      });
      if (pointsError) {
        return { success: false, message: 'Error awarding points: ' + (pointsError.message || JSON.stringify(pointsError)) };
      }
      setLastClaimedDate(new Date().toISOString());
      return { success: true, message: '500 points claimed!' };
    } finally {
      setLoading(false);
    }
  }, [currentUser, lastClaimedDate]);

  return { claimDailyPoints, lastClaimedDate, loading };
}
