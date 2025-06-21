import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

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
  wallet_amount?: number; // Add wallet_amount for leaderboard display
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
  const [lastClaimedDate, setLastClaimedDate] = useState<string | null>(null);
  const { currentUser } = useAuth();

  // Check if user has claimed daily points today
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

  // Call this on mount
  useEffect(() => {
    checkDailyClaim();
  }, [checkDailyClaim]);

  // Function to claim daily points
  const claimDailyPoints = useCallback(async () => {
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
      return { success: false, message: 'Error claiming points' };
    }
    // Award points (update user profile or stats)
    const { error: pointsError } = await supabase.rpc('award_points', {
      p_user_id: currentUser.id,
      p_points: 500,
      p_action_type: 'daily_login',
      p_description: 'Daily login bonus',
      p_metadata: {}
    });
    if (pointsError) {
      return { success: false, message: 'Error awarding points' };
    }
    setLastClaimedDate(new Date().toISOString());
    return { success: true, message: '500 points claimed!' };
  }, [currentUser, lastClaimedDate]);

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

      // Fetch all wallets for users in leaderboard
      const userIds = (usersData || []).map(u => u.id);
      let walletMap: Record<string, number> = {};
      if (userIds.length > 0) {
        const { data: wallets, error: walletsError } = await supabase
          .from('wallets')
          .select('user_id, real_balance')
          .in('user_id', userIds);
        if (!walletsError && wallets) {
          wallets.forEach((w: { user_id: string; real_balance: number }) => {
            walletMap[w.user_id] = w.real_balance;
          });
        }
      }

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
        .select('challenger_id, challenged_id, winner_id, status, amount') as {
          data: { challenger_id: string; challenged_id: string; winner_id: string | null; status: string; amount: number }[] | null;
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

      // Calculate challenge stats per user (use real winner_id)
      const challengeStats = ((challengeData || []) as { challenger_id: string; challenged_id: string; winner_id: string | null; status: string; amount: number }[])
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

          // Count wins and earnings for completed challenges with a real winner
          if (challenge.status === 'completed' && challenge.winner_id) {
            acc[challenge.winner_id] = acc[challenge.winner_id] || { participated: 0, won: 0, earnings: 0 };
            acc[challenge.winner_id].won += 1;
            acc[challenge.winner_id].earnings += challenge.amount * 2 * 0.95; // winner gets both wagers minus 5% platform fee
          }

          return acc;
        }, {});

      // Calculate event winnings per user
      // We'll need to fetch event info for each participant who won
      let eventWinnings: Record<string, number> = {};
      if (eventParticipationData && eventParticipationData.length > 0) {
        // Get all event IDs and user IDs where status is 'won'
        const { data: winningEvents, error: winningEventsError } = await supabase
          .from('event_participants')
          .select('user_id, event_id, status')
          .eq('status', 'won');
        if (!winningEventsError && winningEvents) {
          // Get event wager amounts for these events
          const eventIds = [...new Set(winningEvents.map(e => e.event_id))];
          if (eventIds.length > 0) {
            const { data: eventData, error: eventDataError } = await supabase
              .from('events')
              .select('id, wager_amount')
              .in('id', eventIds);
            if (!eventDataError && eventData) {
              // Map eventId to wager_amount
              const eventWagerMap: Record<string, number> = {};
              eventData.forEach(e => {
                eventWagerMap[e.id] = e.wager_amount || 0;
              });
              // For each winning event, add 2x wager_amount to the winner (minus 3% platform fee)
              winningEvents.forEach(e => {
                const amount = eventWagerMap[e.event_id] || 0;
                if (!eventWinnings[e.user_id]) eventWinnings[e.user_id] = 0;
                eventWinnings[e.user_id] += amount * 2 * 0.97;
              });
            }
          }
        }
      }

      // Process and format user data with type assertion
      const processedUsers = (usersData || [])
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

          // Calculate total earnings (from user_stats and challenges and event winnings)
          const totalEarnings = (user.user_stats?.total_earnings || 0)
            + (challengeStatsForUser.earnings || 0)
            + (eventWinnings[user.id] || 0);

          // Calculate reputation points
          const reputationPoints = (user.reputation_score || 0) + (challengeStatsForUser.won * 10);

          // Get wallet amount for this user
          const wallet_amount = walletMap[user.id] ?? 0;

          return {
            id: user.id,
            name: user.name || 'Anonymous User',
            username: user.username || `user_${user.id.slice(0, 8)}`,
            avatar_url: user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`,
            groups_joined: eventParticipationCounts[user.id] || 0,
            events_won: eventsWon,
            total_winnings: totalEarnings,
            points: Math.floor(reputationPoints),
            rank: 0,
            wallet_amount // Add wallet_amount to leaderboard user
          };
        })
        .filter((user): user is LeaderboardUser => user !== null);

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

  return { users, loading, fetchLeaderboard, claimDailyPoints, lastClaimedDate };
}