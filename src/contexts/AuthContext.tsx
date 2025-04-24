import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from './ToastContext';
import type { User } from '@supabase/supabase-js';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  signInWithGoogle: () => Promise<any>;
  signInWithTwitter: () => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const refreshUser = useCallback(async () => {
    try {
      const { data: { user: supabaseUser } } = await supabase.auth.getUser();

      if (!supabaseUser) {
        setCurrentUser(null);
        return;
      }

      // Get user profile
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      if (error) {
        // If profile doesn't exist, create one
        const { data: newProfile, error: insertError } = await supabase
          .from('users')
          .insert([{
            id: supabaseUser.id,
            email: supabaseUser.email,
            name: supabaseUser.email?.split('@')[0] || 'Anonymous',
            avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${supabaseUser.id}`
          }])
          .select()
          .single();

        if (insertError) throw insertError;
        setCurrentUser(newProfile);
      } else {
        // Map reputation_score to points for consistency
        setCurrentUser({
          ...profile,
          points: profile.reputation_score || 0
        });
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      await refreshUser();
      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }, [refreshUser]);

  const signUp = useCallback(async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;
      toast.showSuccess('Please check your email to verify your account');
      return data;
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  }, [toast]);

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      setCurrentUser(null);
      toast.showSuccess('Signed out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      toast.showError('Failed to sign out');
    }
  }, [toast]);

  const signInWithGoogle = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Google sign-in error:', error);
      return { data: null, error };
    }
  }, []);

  const signInWithTwitter = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'twitter',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Twitter sign-in error:', error);
      return { data: null, error };
    }
  }, []);

  useEffect(() => {
    refreshUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        refreshUser();
      } else {
        setCurrentUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [refreshUser]);

  return (
    <AuthContext.Provider value={{
      currentUser,
      loading,
      signInWithEmail,
      signUp,
      logout,
      refreshUser,
      signInWithGoogle,
      signInWithTwitter
    }}>
      {children}
    </AuthContext.Provider>
  );
};







