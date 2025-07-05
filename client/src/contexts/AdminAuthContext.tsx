import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from './ToastContext';

const ADMIN_EMAILS = [
  'admin@bantahchatbet.com',
  'alwaysdefi16@gmail.com',
  'michealwritesyes@gmail.com'
];

interface AdminAuthContextType {
  isAuthenticated: boolean;
  admin: { email: string; name: string } | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [admin, setAdmin] = useState<{ email: string; name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    checkAdminSession();
  }, []);

  const checkAdminSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        let { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, is_admin, role')
          .eq('id', session.user.id)
          .single();

        if (profileError?.code === 'PGRST116') {
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert([
              { 
                id: session.user.id,
                is_admin: ADMIN_EMAILS.includes(session.user.email),
                role: ADMIN_EMAILS.includes(session.user.email) ? 'ADMIN' : 'USER',
                balance: 0
              }
            ])
            .select()
            .single();

          if (createError) throw createError;
          profile = newProfile;
        } else if (profileError) {
          throw profileError;
        }

        if (profile?.is_admin === true || profile?.role === 'ADMIN') {
          setIsAuthenticated(true);
          setAdmin({ 
            email: session.user.email || '',
            name: 'Admin'
          });
        }
      }
    } catch (error) {
      console.error('Error checking admin session:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      if (data.user) {
        const isAdmin = ADMIN_EMAILS.includes(email);
        console.log('Login attempt for:', email);
        console.log('Is admin email:', isAdmin);

        // First check if profile exists
        let { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, is_admin, role')
          .eq('id', data.user.id)
          .single();

        // If no profile exists, create one
        if (profileError?.code === 'PGRST116') {
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert([
              { 
                id: data.user.id,
                is_admin: isAdmin,
                role: isAdmin ? 'ADMIN' : 'USER',
                balance: 0
              }
            ])
            .select()
            .single();

          if (createError) throw createError;
          profile = newProfile;
        } else if (profileError) {
          throw profileError;
        } else if (profile && isAdmin && (!profile.is_admin || profile.role !== 'ADMIN')) {
          // Update existing profile if admin status needs updating
          const { data: updatedProfile, error: updateError } = await supabase
            .from('profiles')
            .update({ 
              is_admin: true,
              role: 'ADMIN'
            })
            .eq('id', data.user.id)
            .select()
            .single();

          if (updateError) throw updateError;
          profile = updatedProfile;
        }

        console.log('Final profile:', profile);
        
        if (profile?.is_admin === true || profile?.role === 'ADMIN') {
          setIsAuthenticated(true);
          setAdmin({ 
            email: data.user.email || email,
            name: 'Admin'
          });
          return true;
        }
      }
      
      throw new Error('Not an admin user');
    } catch (error) {
      console.error('Admin login error:', error);
      toast.showError('Invalid admin credentials');
      return false;
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setIsAuthenticated(false);
      setAdmin(null);
    } catch (error) {
      console.error('Logout error:', error);
      toast.showError('Error signing out');
    }
  };

  return (
    <AdminAuthContext.Provider value={{ isAuthenticated, admin, login, logout, loading }}>
      {children}
    </AdminAuthContext.Provider>
  );
};