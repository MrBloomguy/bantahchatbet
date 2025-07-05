import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

interface User {
  id: string;
  name: string;
  username: string;
  avatar_url?: string;
  stats?: {
    wins: number;
    total_matches: number;
  };
}

export const useSearchUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const { currentUser } = useAuth();
  const toast = useToast();

  const searchUsers = useCallback(async (query: string) => {
    if (!query.trim() || query.trim().length < 1) {
      setUsers([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .neq('id', currentUser?.id)
        .ilike('username', `%${query}%`)
        .limit(10);

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.showError('Failed to fetch users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id, toast]);

  return {
    users,
    loading,
    searchUsers
  };
};
