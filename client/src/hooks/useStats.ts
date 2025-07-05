import { useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

export interface PlatformStats {
  total_users: number;
  total_events: number;
  total_groups: number;
  total_pool_amount: number;
  total_platform_fees: number;
  active_users_last_30d: number;
  category_stats: {
    category: string;
    event_count: number;
    total_pool: number;
    platform_fees: number;
  }[];
}

export interface UserStats {
  events_created: number;
  events_participated: number;
  total_wagered_yes: number;
  total_wagered_no: number;
  events_won: number;
  events_lost: number;
  current_balance: number;
}

export interface GroupStats {
  member_count: number;
  total_events: number;
  total_pool_amount: number;
  total_platform_fees: number;
}

export function useStats() {
  const { currentUser } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  const getPlatformStats = useCallback(async (): Promise<PlatformStats> => {
    if (!currentUser?.is_admin) {
      throw new Error('Only admins can view platform stats');
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_platform_summary');

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching platform stats:', error);
      toast.showError('Failed to fetch platform statistics');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [currentUser, toast]);

  const getUserStats = useCallback(async (userId: string): Promise<UserStats> => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching user stats:', error);
      toast.showError('Failed to fetch user statistics');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const getGroupStats = useCallback(async (groupId: string): Promise<GroupStats> => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('group_stats')
        .select('*')
        .eq('group_id', groupId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching group stats:', error);
      toast.showError('Failed to fetch group statistics');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return {
    loading,
    getPlatformStats,
    getUserStats,
    getGroupStats
  };
}