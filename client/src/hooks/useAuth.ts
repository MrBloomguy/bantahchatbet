import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../config/supabaseClient';
import { useToast } from '../contexts/ToastContext';
import { User } from '@supabase/supabase-js';

interface Profile {
  id: string;
  name: string;
  avatar_url?: string;
  username?: string;
  is_admin?: boolean;
}

export function useAuth() {
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const toast = useToast();

  const refreshUser = useCallback(async (user: User | null) => {
    if (!user) {
      setCurrentUser(null);
      setAuthenticated(false);
      setLoading(false);
      return;
    }

    try {
      // Add debug logging
      console.log('Refreshing user profile for:', user.id);

      const { data: profile, error } = await supabase
        .from('users')
        .select('id, name, avatar_url, username, is_admin') // Explicitly select is_admin
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;

      // Add debug logging
      console.log('Loaded profile:', profile);

      setCurrentUser(profile);
      setAuthenticated(true);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      toast.showError('Failed to load user profile');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      await refreshUser(data.user);
      return data;
    } catch (error) {
      console.error('Login error:', error);
      toast.showError('Failed to login');
      throw error;
    }
  };

  const signup = async (email: string, password: string, name: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      });

      if (error) throw error;
      await refreshUser(data.user);
      return data;
    } catch (error) {
      console.error('Signup error:', error);
      toast.showError('Failed to create account');
      throw error;
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setCurrentUser(null);
      setAuthenticated(false);
    } catch (error) {
      console.error('Logout error:', error);
      toast.showError('Failed to logout');
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Google login error:', error);
      toast.showError('Failed to sign in with Google');
      throw error;
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        await refreshUser(session?.user ?? null);
      }
    );

    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      refreshUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [refreshUser]);

  return {
    currentUser,
    loading,
    authenticated,
    login,
    logout,
    signup,
    refreshUser,
    signInWithGoogle,
  };
}
