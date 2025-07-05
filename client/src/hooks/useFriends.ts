import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

interface Friend {
  id: string;
  name: string | null;
  username: string | null;
  avatar_url: string | null;
  status?: 'online' | 'offline' | 'away' | 'sleeping';
}

export function useFriends() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const toast = useToast();

  const fetchFriends = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          name,
          username,
          avatar_url,
          status
        `)
        .order('username');

      if (error) throw error;

      setFriends(data || []);
    } catch (error) {
      console.error('Error fetching friends:', error);
      toast.showError('Failed to load friends');
    } finally {
      setLoading(false);
    }
  }, [user?.id, toast]);

  const searchFriends = useCallback(async (query: string) => {
    if (!user?.id) return [];
    if (!query.trim()) return friends;

    try {
      const searchTerm = query.toLowerCase().trim();
      const { data, error } = await supabase
        .from('users')
        .select('id, name, username, avatar_url, status')
        .or(`username.ilike.%${searchTerm}%,name.ilike.%${searchTerm}%`)
        .order('username');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching friends:', error);
      toast.showError('Failed to search friends');
      return [];
    }
  }, [user?.id, friends, toast]);

  useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);

  return {
    friends,
    loading,
    fetchFriends,
    searchFriends
  };
}