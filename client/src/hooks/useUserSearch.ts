// src/hooks/useUserSearch.ts
import { useState, useEffect, useCallback, useRef } from 'react';
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

export const useUserSearch = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { currentUser } = useAuth();
  const toast = useToast();
  const mounted = useRef(true);

  useEffect(() => {
    return () => {
      mounted.current = false;
    };
  }, []);

  const searchUsers = useCallback((query: string) => {
    if (typeof query !== 'string') return;
    setSearchTerm(query);
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    const performSearch = async () => {
      if (!searchTerm.trim() || searchTerm.trim().length < 2) {
        if (mounted.current) {
          setUsers([]);
          setLoading(false);
        }
        return;
      }

      if (mounted.current) {
        setLoading(true);
      }

      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .neq('id', currentUser?.id)
          .or(`name.ilike.%${searchTerm}%,username.ilike.%${searchTerm}%`)
          .limit(10);

        if (error) throw error;
        if (mounted.current) {
          setUsers(data || []);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
        if (mounted.current) {
          toast.showError('Failed to fetch users');
          setUsers([]);
        }
      } finally {
        if (mounted.current) {
          setLoading(false);
        }
      }
    };

    timer = setTimeout(performSearch, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, currentUser?.id, toast]);

  return {
    users,
    loading,
    searchUsers,
  };
};