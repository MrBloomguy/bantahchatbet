import { useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

export interface Profile {
  id: string;
  name: string;
  username: string;
  avatar_url: string;
  bio?: string;
  followers_count: number;
  following_count: number;
  is_following?: boolean;
  points: number; // Add points field
  stats?: {
    events_won: number;
    events_participated: number;
    total_earnings: number;
  };
}

export function useProfile() {
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingFollow, setLoadingFollow] = useState(false);
  const [loadingUnfollow, setLoadingUnfollow] = useState(false);
  const { currentUser } = useAuth();
  const toast = useToast();

  const getProfile = useCallback(async (identifier: string): Promise<Profile | null> => {
    try {
      setLoadingProfile(true);

      // Fetch profile using the RPC function
      const { data: profileData, error: profileError } = await supabase
        .rpc('get_profile_by_identifier', { p_username: identifier })
        .single();

      if (profileError) throw profileError;
      if (!profileData) {
        toast.showError('Profile not found');
        return null;
      }

      // Fetch user details including reputation_score directly from users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, name, username, avatar_url, bio, reputation_score') // Fetch reputation_score
        .eq('id', profileData.user_id)
        .single();

      if (userError) throw new Error('Error fetching user data: ' + userError.message);
      if (!userData) throw new Error('User data not found for profile');

      // Map the explicit column names back to our interface
      const profile: Profile = {
        id: userData.id,
        name: userData.name || '',
        username: userData.username || '',
        avatar_url: userData.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.id}`,
        bio: userData.bio,
        followers_count: profileData.user_followers_count || 0,
        following_count: profileData.user_following_count || 0,
        is_following: profileData.user_is_following || false,
        points: userData.reputation_score || 0, // Assign reputation_score to points
      };

      // Ensure user stats exist and fetch them
      await supabase.rpc('ensure_user_stats', { p_user_id: profile.id });

      // Fetch user stats
      const { data: stats, error: statsError } = await supabase
        .from('user_stats')
        .select('events_won, events_participated, total_earnings')
        .eq('user_id', profile.id)
        .maybeSingle();

      if (statsError) {
        console.error('Error fetching user stats:', statsError);
      }

      return {
        ...profile,
        stats: stats || {
          events_won: 0,
          events_participated: 0,
          total_earnings: 0,
        },
      };
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.showError('Failed to load profile');
      return null;
    } finally {
      setLoadingProfile(false);
    }
  }, [toast]);

  const followUser = useCallback(async (userId: string) => {
    if (!currentUser) {
      toast.showError('Please sign in to follow users');
      return false;
    }

    try {
      setLoadingFollow(true);
      // Removed privyDIDtoUUID usage

      // Create follow relationship
      const { error } = await supabase
        .from('followers')
        .insert({
          follower_id: followerId,
          following_id: userId
        });

      if (error) throw error;

      // Create notification
      await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          notification_type: 'follow',
          title: 'New Follower',
          content: `${currentUser?.name || 'Someone'} started following you`,
          metadata: {
            follower_id: followerId
          }
        });

      toast.showSuccess('Successfully followed user');
      return true;
    } catch (error) {
      console.error('Error following user:', error);
      toast.showError('Failed to follow user');
      return false;
    } finally {
      setLoadingFollow(false);
    }
  }, [currentUser, toast]);

  const unfollowUser = useCallback(async (userId: string) => {
    if (!currentUser) {
      toast.showError('Please sign in to unfollow users');
      return false;
    }

    try {
      setLoadingUnfollow(true);
      // Removed privyDIDtoUUID usage

      const { error } = await supabase
        .from('followers')
        .delete()
        .eq('follower_id', followerId)
        .eq('following_id', userId);

      if (error) throw error;

      toast.showSuccess('Successfully unfollowed user');
      return true;
    } catch (error) {
      console.error('Error unfollowing user:', error);
      toast.showError('Failed to unfollow user');
      return false;
    } finally {
      setLoadingUnfollow(false);
    }
  }, [currentUser, toast]);

  return {
    loadingProfile,
    loadingFollow,
    loadingUnfollow,
    getProfile,
    followUser,
    unfollowUser
  };
}
