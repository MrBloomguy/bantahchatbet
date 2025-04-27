import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { auth } from '../firebase/config';
import { useToast } from './ToastContext';
import type { User } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
  refreshUser: (customUser?: any) => Promise<void>;
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

  const refreshUser = useCallback(async (customUser = null) => {
    try {
      // If a custom user is provided, use it directly
      if (customUser) {
        console.log('Setting custom user:', customUser);
        setCurrentUser(customUser);
        setLoading(false);
        return;
      }

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

  // Auth context

  const logout = useCallback(async () => {
    try {
      // Check if we have a Firebase user
      const firebaseUser = auth.currentUser;

      if (firebaseUser) {
        // Sign out from Firebase
        await auth.signOut();
        console.log('Signed out from Firebase');
      }

      // Sign out from Supabase
      await supabase.auth.signOut();

      // Clear user state
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

  // Handle Firebase authentication
  const handleFirebaseAuth = useCallback(async () => {
    try {
      // Check if there's a Firebase user
      const firebaseUser = auth.currentUser;

      if (firebaseUser) {
        console.log('Firebase user found:', firebaseUser);

        // Check if the user has a phone number
        if (firebaseUser.phoneNumber) {
          // Check if the user already exists in Supabase
          const { data: existingUser, error: fetchError } = await supabase
            .from('profiles')
            .select('*')
            .eq('phone', firebaseUser.phoneNumber)
            .single();

          if (fetchError && fetchError.code !== 'PGRST116') {
            console.error('Error fetching user profile:', fetchError);
          }

          if (existingUser) {
            // User exists, use their profile
            setCurrentUser(existingUser);
            setLoading(false);
            return true;
          } else {
            // User doesn't exist, create a new profile
            const newUser = {
              id: firebaseUser.uid,
              phone: firebaseUser.phoneNumber,
              name: `User ${firebaseUser.phoneNumber.slice(-4)}`,
              avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${firebaseUser.phoneNumber}`,
              created_at: new Date().toISOString()
            };

            // Insert the new user into Supabase
            const { data: insertedUser, error: insertError } = await supabase
              .from('profiles')
              .insert(newUser)
              .select()
              .single();

            if (insertError) {
              console.error('Error creating user profile:', insertError);
              return false;
            }

            setCurrentUser(insertedUser);
            setLoading(false);
            return true;
          }
        }
      }

      return false;
    } catch (error) {
      console.error('Error handling Firebase auth:', error);
      return false;
    }
  }, []);

  // No Privy user handling needed

  // Run this effect on mount and when the URL changes
  useEffect(() => {
    const initAuth = async () => {
      console.log('Initializing authentication...');

      // First check for Firebase auth
      const isFirebaseAuth = await handleFirebaseAuth();
      console.log('Firebase auth check result:', isFirebaseAuth);

      // If not using Firebase auth, proceed with Supabase auth
      if (!isFirebaseAuth) {
        refreshUser();
      }
    };

    initAuth();

    // Set up Firebase auth state listener
    const unsubscribeFirebase = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        // Firebase user is logged in
        handleFirebaseAuth();
      } else {
        // Firebase user is logged out, check Supabase
        const session = await supabase.auth.getSession();
        if (!session.data.session) {
          // No Supabase session either, user is completely logged out
          setCurrentUser(null);
        }
      }
    });

    // Set up Supabase auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        refreshUser();
      } else {
        // If no Supabase session, check Firebase before setting user to null
        if (!auth.currentUser) {
          setCurrentUser(null);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
      unsubscribeFirebase();
    };
  }, [refreshUser, handleFirebaseAuth, window.location.pathname]);

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







