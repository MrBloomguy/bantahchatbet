import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface LeaderboardUser {
  id: string;
  name: string;
  username: string;
  avatar_url: string;
  groups_joined: number;
  events_won: number;
  total_winnings: number;
  points: number;
  rank: number;
}

export interface UserData {
  id: string;
  name: string | null;
  username: string | null;
  avatar_url: string | null;
  reputation_score: number;
  user_stats: {
    events_won: number;
    events_participated: number;
    total_earnings: number;
  } | null;
}

interface ParticipationData {
  user_id: string;
}

export function useLeaderboard() {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch users with their stats and reputation
      const { data: usersData, error: usersError } = await supabase
        .from('users_view')
        .select(`
          id,
          name,
          username,
          avatar_url,
          reputation_score,
          user_stats (
            events_won,
            events_participated,
            total_earnings
          )
        `) as { data: UserData[] | null; error: any };

      if (usersError) throw usersError;

      // Get participation counts
      const { data: participationData, error: participationError } = await supabase
        .from('event_participants')
        .select('user_id') as { data: ParticipationData[] | null; error: any };

      if (participationError) {
        console.error('Error fetching participation data:', participationError);
      }

      // Count participations per user
      const participationCounts = ((participationData || []) as ParticipationData[]).reduce<Record<string, number>>((acc, item) => {
        acc[item.user_id] = (acc[item.user_id] || 0) + 1;
        return acc;
      }, {});

      // Process and format user data with type assertion
      const processedUsers: LeaderboardUser[] = (usersData || []).map(user => ({
        id: user.id,
        name: user.name || 'Anonymous User',
        username: user.username || `user_${user.id.slice(0, 8)}`,
        avatar_url: user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`,
        groups_joined: participationCounts[user.id] || 0,
        events_won: user.user_stats?.events_won || 0,
        total_winnings: user.user_stats?.total_earnings || 0,
        points: Math.floor(user.reputation_score || 0),
        rank: 0
      }));

      // Sort users by score
      const sortedUsers = [...processedUsers].sort((a, b) => {
        const aScore = Math.floor(a.points * 100 + a.events_won * 50 + a.total_winnings * 0.1 + a.groups_joined * 10);
        const bScore = Math.floor(b.points * 100 + b.events_won * 50 + b.total_winnings * 0.1 + b.groups_joined * 10);
        return bScore - aScore;
      });

      // Assign ranks
      sortedUsers.forEach((user, index) => {
        user.rank = index + 1;
      });

      setUsers(sortedUsers);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard();

    // Set up realtime subscription for user stats updates
    const subscription = supabase
      .channel('leaderboard-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'user_stats' 
      }, () => {
        fetchLeaderboard();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchLeaderboard]);

  return { users, loading, fetchLeaderboard };
}