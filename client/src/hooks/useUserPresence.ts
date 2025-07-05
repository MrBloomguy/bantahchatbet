import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

type OnlineStatus = 'online' | 'away' | 'offline';

interface UserPresence {
  user_id: string;
  status: OnlineStatus;
  last_seen: string;
}

export const useUserPresence = () => {
  const { currentUser } = useAuth();
  const [userStatuses, setUserStatuses] = useState<Record<string, OnlineStatus>>({});
  const [loading, setLoading] = useState(true);

  // Update current user's status
  const updateUserStatus = useCallback(async (status: OnlineStatus) => {
    if (!currentUser) return;

    try {
      const now = new Date().toISOString();

      // First check if the user has a session
      const { data: sessionData } = await supabase.auth.getSession();

      if (!sessionData.session) {
        // If no session, just log and return without trying to update
        console.log('No active Supabase session, skipping presence update');
        return;
      }

      // Try to update the user presence
      const { error } = await supabase
        .from('user_presence')
        .upsert({
          user_id: currentUser.id,
          status,
          last_seen: now
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error updating user status:', error);
        // Don't throw, just log the error
      }
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  }, [currentUser]);

  // Set user as online
  const setOnline = useCallback(() => {
    updateUserStatus('online');
  }, [updateUserStatus]);

  // Set user as away
  const setAway = useCallback(() => {
    updateUserStatus('away');
  }, [updateUserStatus]);

  // Set user as offline
  const setOffline = useCallback(() => {
    updateUserStatus('offline');
  }, [updateUserStatus]);

  // Fetch all user statuses
  const fetchUserStatuses = useCallback(async () => {
    try {
      setLoading(true);

      // First, call the function to update inactive users
      await supabase.rpc('check_inactive_users');

      // Then fetch all user statuses
      const { data, error } = await supabase
        .from('user_presence')
        .select('user_id, status, last_seen');

      if (error) throw error;

      // Convert to a map of user_id -> status
      const statusMap: Record<string, OnlineStatus> = {};
      data.forEach((presence: UserPresence) => {
        statusMap[presence.user_id] = presence.status as OnlineStatus;
      });

      setUserStatuses(statusMap);
    } catch (error) {
      console.error('Error fetching user statuses:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Get a specific user's status
  const getUserStatus = useCallback(async (userId: string): Promise<OnlineStatus> => {
    // First check the local cache
    if (userStatuses[userId]) {
      return userStatuses[userId];
    }

    // If not in cache, call the database function
    try {
      const { data, error } = await supabase.rpc('get_user_status', {
        p_user_id: userId
      });

      if (error) throw error;

      // Update the local cache
      setUserStatuses(prev => ({
        ...prev,
        [userId]: data as OnlineStatus
      }));

      return data as OnlineStatus;
    } catch (error) {
      console.error('Error getting user status:', error);
      return 'offline';
    }
  }, [userStatuses]);

  // Set up real-time subscription for user presence changes
  useEffect(() => {
    if (!currentUser) return;

    // Check if the user has a Supabase session before setting up presence
    const checkSessionAndSetup = async () => {
      try {
        // Check for an active session
        const { data: sessionData } = await supabase.auth.getSession();

        if (!sessionData.session) {
          console.log('No active Supabase session, skipping presence setup');
          return;
        }

        // Initial fetch
        fetchUserStatuses();

        // Set current user as online
        setOnline();

        // Set up subscription for presence changes
        const presenceSubscription = supabase
          .channel('user-presence-changes')
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'user_presence'
          }, (payload) => {
            const presence = payload.new as UserPresence;

            setUserStatuses(prev => ({
              ...prev,
              [presence.user_id]: presence.status
            }));
          })
          .subscribe();

        return presenceSubscription;
      } catch (error) {
        console.error('Error setting up presence:', error);
        return null;
      }
    };

    // Call the setup function and store the subscription
    let presenceSubscription: any = null;
    checkSessionAndSetup().then(sub => {
      presenceSubscription = sub;
    });

    // Set up activity tracking
    let activityTimeout: NodeJS.Timeout | null = null;

    const handleActivity = () => {
      if (activityTimeout) {
        clearTimeout(activityTimeout);
      }

      // Set user as online
      setOnline();

      // Set user as away after 2 minutes of inactivity
      activityTimeout = setTimeout(() => {
        setAway();
      }, 2 * 60 * 1000);
    };

    // Track user activity
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('scroll', handleActivity);

    // Set up page visibility change detection
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setOnline();
      } else {
        setAway();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Set up beforeunload event to mark user as offline when leaving
    const handleBeforeUnload = () => {
      setOffline();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Initial activity trigger
    handleActivity();

    // Clean up
    return () => {
      if (activityTimeout) {
        clearTimeout(activityTimeout);
      }

      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);

      // Only try to set offline and remove channel if we have a subscription
      if (presenceSubscription) {
        // Set user as offline when unmounting
        setOffline();

        // Unsubscribe from presence changes
        supabase.removeChannel(presenceSubscription);
      }
    };
  }, [currentUser, fetchUserStatuses, setOnline, setAway, setOffline]);

  return {
    userStatuses,
    getUserStatus,
    loading,
    setOnline,
    setAway,
    setOffline,
    refreshStatuses: fetchUserStatuses
  };
};
