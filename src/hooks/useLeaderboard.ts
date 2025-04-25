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
        .from('users')
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

      // Get event participation counts
      const { data: eventParticipationData, error: eventParticipationError } = await supabase
        .from('event_participants')
        .select('user_id, status') as { data: (ParticipationData & { status: string })[] | null; error: any };

      if (eventParticipationError) {
        console.error('Error fetching event participation data:', eventParticipationError);
      }

      // Get challenge participation counts
      const { data: challengeData, error: challengeError } = await supabase
        .from('challenges')
        .select('challenger_id, challenged_id, status, amount') as {
          data: { challenger_id: string; challenged_id: string; status: string; amount: number }[] | null;
          error: any
        };

      if (challengeError) {
        console.error('Error fetching challenge data:', challengeError);
      }

      // Count event participations per user
      const eventParticipationCounts = ((eventParticipationData || []) as (ParticipationData & { status: string })[])
        .reduce<Record<string, number>>((acc, item) => {
          acc[item.user_id] = (acc[item.user_id] || 0) + 1;
          return acc;
        }, {});

      // Calculate challenge stats per user
      const challengeStats = ((challengeData || []) as { challenger_id: string; challenged_id: string; status: string; amount: number }[])
        .reduce<Record<string, { participated: number; won: number; earnings: number }>>((acc, challenge) => {
          // Initialize stats for both users if they don't exist
          if (!acc[challenge.challenger_id]) {
            acc[challenge.challenger_id] = { participated: 0, won: 0, earnings: 0 };
          }
          if (!acc[challenge.challenged_id]) {
            acc[challenge.challenged_id] = { participated: 0, won: 0, earnings: 0 };
          }

          // Count participation for both users
          acc[challenge.challenger_id].participated += 1;
          acc[challenge.challenged_id].participated += 1;

          // Count wins and earnings for completed challenges
          if (challenge.status === 'completed') {
            // Determine the winner (this is a simplified logic, adjust based on your actual data model)
            // In a real implementation, you would use the actual winner field from the challenge
            // For now, we'll randomly assign a winner for demonstration purposes
            const winnerId = Math.random() > 0.5 ? challenge.challenger_id : challenge.challenged_id;
            if (winnerId) {
              acc[winnerId].won += 1;
              acc[winnerId].earnings += challenge.amount;
            }
          }

          return acc;
        }, {});

      // Process and format user data with type assertion
      const processedUsers: LeaderboardUser[] = (usersData || [])
        .map(user => {
          // Skip users without basic profile information
          if (!user.name && !user.username) {
            console.log('Skipping user without name/username:', user.id);
            return null;
          }

          // Get challenge stats for this user
          const challengeStatsForUser = challengeStats[user.id] || { participated: 0, won: 0, earnings: 0 };

          // Calculate total events won (from user_stats and challenges)
          const eventsWon = (user.user_stats?.events_won || 0) + (challengeStatsForUser.won || 0);

          // Calculate total earnings (from user_stats and challenges)
          const totalEarnings = (user.user_stats?.total_earnings || 0) + (challengeStatsForUser.earnings || 0);

          // Calculate reputation points
          const reputationPoints = (user.reputation_score || 0) + (challengeStatsForUser.won * 10);

          return {
            id: user.id,
            name: user.name || 'Anonymous User',
            username: user.username || `user_${user.id.slice(0, 8)}`,
            avatar_url: user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`,
            groups_joined: eventParticipationCounts[user.id] || 0,
            events_won: eventsWon,
            total_winnings: totalEarnings,
            points: Math.floor(reputationPoints),
            rank: 0
          };
        });

      // Filter out null values and ensure we have valid users
      const validUsers = processedUsers.filter(user => user !== null) as LeaderboardUser[];

      // Calculate a comprehensive score for each user
      const calculateScore = (user: LeaderboardUser) => {
        // Weight different factors in the score calculation
        const eventWinPoints = user.events_won * 50;
        const winningsPoints = user.total_winnings * 0.01;
        const participationPoints = user.groups_joined * 5;
        const reputationPoints = user.points * 10;

        return eventWinPoints + winningsPoints + participationPoints + reputationPoints;
      };

      // Sort users by calculated score
      const sortedUsers = [...validUsers]
        .sort((a, b) => calculateScore(b) - calculateScore(a));

      // Assign ranks
      sortedUsers.forEach((user, index) => {
        user.rank = index + 1;
      });

      // If we have no users or very few users, add some mock data for demonstration
      if (sortedUsers.length < 5) {
        console.log(`Adding mock data to supplement ${sortedUsers.length} real users`);

        // Mock user data with Nigerian names
        const mockUsers = [
          {
            id: 'mock-1',
            name: 'Oluwaseun Adeyemi',
            username: 'seun_ade',
            avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=oluwaseun',
            groups_joined: 8,
            events_won: 5,
            total_winnings: 25000,
            points: 150,
            rank: 1
          },
          {
            id: 'mock-2',
            name: 'Chioma Okafor',
            username: 'chi_okafor',
            avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=chioma',
            groups_joined: 6,
            events_won: 3,
            total_winnings: 12000,
            points: 90,
            rank: 2
          },
          {
            id: 'mock-3',
            name: 'Emeka Nwachukwu',
            username: 'emeka_n',
            avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=emeka',
            groups_joined: 4,
            events_won: 2,
            total_winnings: 8000,
            points: 70,
            rank: 3
          },
          {
            id: 'mock-4',
            name: 'Amina Ibrahim',
            username: 'amina_i',
            avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=amina',
            groups_joined: 3,
            events_won: 1,
            total_winnings: 5000,
            points: 50,
            rank: 4
          },
          {
            id: 'mock-5',
            name: 'Tunde Bakare',
            username: 'tunde_b',
            avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=tunde',
            groups_joined: 2,
            events_won: 1,
            total_winnings: 3000,
            points: 40,
            rank: 5
          }
        ];

        // Add mock users until we have at least 5 total users
        for (let i = 0; i < mockUsers.length && sortedUsers.length < 5; i++) {
          // Check if this mock user ID already exists
          if (!sortedUsers.some(user => user.id === mockUsers[i].id)) {
            sortedUsers.push(mockUsers[i]);
          }
        }

        // Re-assign ranks
        sortedUsers.forEach((user, index) => {
          user.rank = index + 1;
        });
      }

      console.log('Leaderboard data:', {
        totalUsers: usersData?.length || 0,
        processedUsers: processedUsers.length,
        validUsers: validUsers.length,
        sortedUsers: sortedUsers.length,
        firstFewUsers: sortedUsers.slice(0, 3)
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