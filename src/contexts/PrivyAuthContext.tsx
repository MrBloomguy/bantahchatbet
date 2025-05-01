import React, { createContext, useContext, useState, useEffect } from 'react';
import { PrivyProvider } from '@privy-io/react-auth';
import { usePrivy } from '@privy-io/react-auth';
import { supabase } from '../lib/supabase';
import { privyDIDtoUUID } from '../utils/auth';

// Define the context type
interface PrivyAuthContextType {
  ready: boolean;
  authenticated: boolean;
  user: any;
  privyUser: any;
  isInitialized: boolean;
  login: () => void;
  logout: () => void;
}

// Create the context
const PrivyAuthContext = createContext<PrivyAuthContextType | undefined>(undefined);

// Custom hook to use the context
export const usePrivyAuth = () => {
  const context = useContext(PrivyAuthContext);
  if (context === undefined) {
    console.warn('usePrivyAuth must be used within a PrivyAuthProvider');
    return undefined;
  }
  return context;
};

// Internal component to manage Privy auth state
const PrivyAuthManager: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const [privyUser, setPrivyUser] = useState<any>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Handle Privy auth state changes
  useEffect(() => {
    if (!ready) return;

    const handlePrivyAuth = async () => {
      console.log('Privy auth state changed:', { ready, authenticated, user });
      setIsInitialized(true);

      if (authenticated && user) {
        console.log('Privy user authenticated:', user);

        try {
          // Convert Privy DID to UUID
          const userId = privyDIDtoUUID(user.id);

          // Get user display name from various sources
          let displayName = 'Privy User';
          let email = null;

          if (user.email?.address) {
            displayName = user.email.address.split('@')[0];
            email = user.email.address;
          } else if (user.google?.name) {
            displayName = user.google.name;
            email = user.google.email;
          } else if (user.twitter?.username) {
            displayName = user.twitter.username;
          }

          // Get avatar from various sources
          let avatarUrl = user.avatar;
          if (!avatarUrl) {
            if (user.google?.picture) {
              avatarUrl = user.google.picture;
            } else {
              avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`;
            }
          }

          // Create a username based on the provider
          const username = user.email
            ? `email_${user.email.address.split('@')[0]}_${userId.substring(0, 6)}`
            : user.google
              ? `google_${user.google.email.split('@')[0]}_${userId.substring(0, 6)}`
              : user.twitter
                ? `twitter_${user.twitter.username}_${userId.substring(0, 6)}`
                : `privy_${userId.substring(0, 10)}`;

          // Create a user object compatible with your app
          const newPrivyUser = {
            id: userId,
            name: displayName,
            username: username.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
            email: email,
            avatar_url: avatarUrl,
            bio: `Privy user (${email || user.twitter?.username || 'wallet'})`,
            privy_id: user.id, // Store original Privy ID
            is_privy_auth: true,
            reputation_score: 0,
            points: 0
          };

          console.log('Created user object from Privy:', newPrivyUser);

          // First check if user exists by Privy ID
          let { data: existingUserByPrivyId } = await supabase
            .from('users')
            .select('*')
            .eq('privy_id', user.id)
            .maybeSingle();

          // If not found by Privy ID, check by UUID
          if (!existingUserByPrivyId) {
            const { data: existingUserById } = await supabase
              .from('users')
              .select('*')
              .eq('id', userId)
              .maybeSingle();

            existingUserByPrivyId = existingUserById;
          }

          // If still not found and we have an email, check by email
          if (!existingUserByPrivyId && email) {
            const { data: existingUserByEmail } = await supabase
              .from('users')
              .select('*')
              .eq('email', email)
              .maybeSingle();

            existingUserByPrivyId = existingUserByEmail;
          }

          if (!existingUserByPrivyId) {
            // Create new user in database
            console.log('Creating new user in database:', newPrivyUser);

            // First create a Supabase auth user to handle RLS policies
            const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
            let supabaseAuthUser;

            if (newPrivyUser.email) {
              try {
                // Try to create a Supabase auth user
                const { data: authData, error: authError } = await supabase.auth.signUp({
                  email: newPrivyUser.email,
                  password: randomPassword,
                  options: {
                    data: {
                      name: newPrivyUser.name,
                      avatar_url: newPrivyUser.avatar_url,
                      privy_id: user.id
                    }
                  }
                });

                if (authError) {
                  console.error('Error creating Supabase auth user:', authError);
                  // Try to sign in instead (user might already exist)
                  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                    email: newPrivyUser.email,
                    password: randomPassword
                  });

                  if (signInError) {
                    console.error('Error signing in to Supabase:', signInError);
                    // Continue without Supabase auth
                  } else {
                    supabaseAuthUser = signInData.user;
                  }
                } else {
                  supabaseAuthUser = authData.user;
                }
              } catch (authError) {
                console.error('Error with Supabase auth:', authError);
                // Continue without Supabase auth
              }
            }

            // Now create the user in the database
            const { data: insertedUser, error: insertError } = await supabase
              .from('users')
              .insert({
                id: supabaseAuthUser?.id || userId,
                name: newPrivyUser.name,
                username: newPrivyUser.username,
                email: newPrivyUser.email,
                avatar_url: newPrivyUser.avatar_url,
                bio: newPrivyUser.bio,
                privy_id: user.id,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                reputation_score: 0
              })
              .select()
              .single();

            if (insertError) {
              console.error('Error creating user in database:', insertError);
              // Don't throw, try to continue
            }

            console.log('New user created successfully:', insertedUser);

            // Store the inserted user in state
            setPrivyUser({
              ...insertedUser,
              points: 0,
              is_privy_auth: true
            });
          } else {
            console.log('User already exists in database:', existingUserByPrivyId);

            // Try to sign in with Supabase auth if we have an email
            if (existingUserByPrivyId.email) {
              try {
                // Check if there's a Supabase session already
                const { data: sessionData } = await supabase.auth.getSession();

                if (!sessionData.session) {
                  // Try to sign in with magic link
                  const { error: signInError } = await supabase.auth.signInWithOtp({
                    email: existingUserByPrivyId.email,
                    options: {
                      shouldCreateUser: false
                    }
                  });

                  if (signInError) {
                    console.log('Could not send magic link, trying alternative auth:', signInError);

                    // Try to sign in with email/password (dummy password)
                    const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
                    await supabase.auth.signInWithPassword({
                      email: existingUserByPrivyId.email,
                      password: randomPassword
                    }).catch(err => {
                      console.log('Expected error with password auth, continuing:', err);
                    });
                  } else {
                    console.log('Magic link sent successfully');
                  }
                } else {
                  console.log('User already has a Supabase session');
                }
              } catch (authError) {
                console.error('Error with Supabase auth:', authError);
              }
            }

            // Update the user with Privy ID if it's missing
            if (!existingUserByPrivyId.privy_id) {
              const { error: updateError } = await supabase
                .from('users')
                .update({
                  privy_id: user.id,
                  updated_at: new Date().toISOString()
                })
                .eq('id', existingUserByPrivyId.id);

              if (updateError) {
                console.error('Error updating user with Privy ID:', updateError);
              }
            } else {
              // Just update the last login time
              const { error: updateError } = await supabase
                .from('users')
                .update({
                  updated_at: new Date().toISOString()
                })
                .eq('id', existingUserByPrivyId.id);

              if (updateError) {
                console.error('Error updating user last login time:', updateError);
              }
            }

            // Store the existing user in state
            setPrivyUser({
              ...existingUserByPrivyId,
              points: existingUserByPrivyId.reputation_score || 0,
              is_privy_auth: true,
              privy_id: user.id
            });
          }
        } catch (error) {
          console.error('Error handling Privy auth:', error);
          setIsInitialized(true);
        }
      } else {
        setPrivyUser(null);
      }
    };

    handlePrivyAuth();
  }, [ready, authenticated, user]);

  // Handle login
  const handleLogin = () => {
    console.log('Privy login called');
    if (login) {
      login();
    } else {
      console.error('Privy login function is not available');
    }
  };

  // Handle logout
  const handleLogout = () => {
    console.log('Privy logout called');
    if (logout) {
      logout();
      setPrivyUser(null);
    } else {
      console.error('Privy logout function is not available');
    }
  };

  return (
    <PrivyAuthContext.Provider value={{
      ready,
      authenticated,
      user,
      privyUser,
      isInitialized,
      logout: handleLogout,
      login: handleLogin
    }}>
      {children}
    </PrivyAuthContext.Provider>
  );
};

// Provider component that wraps the app
export const PrivyAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const privyAppId = import.meta.env.VITE_PRIVY_APP_ID;
  console.log('Privy App ID:', privyAppId);

  if (!privyAppId) {
    console.error('Privy App ID is not defined in environment variables');
  }

  // Handle errors globally for Privy
  window.addEventListener('error', (event) => {
    if (event.message && (
      event.message.includes('privy') ||
      event.message.includes('Privy') ||
      event.message.includes('Content Security Policy')
    )) {
      console.warn('Caught Privy-related error:', event.message);
      event.preventDefault();
      return true;
    }
    return false;
  }, true);

  return (
    <PrivyProvider
      appId={privyAppId || ''}
      config={{
        appearance: {
          theme: 'dark',
          accentColor: '#CCFF00',
          showWalletLoginFirst: false
        },
        loginMethods: ['email', 'wallet', 'google', 'twitter'],
        defaultChain: undefined,
        supportedChains: undefined,
        embeddedWallets: {
          createOnLogin: false,
          noPromptOnSignature: true
        },
        ui: {
          modal: {
            displayMode: 'popup'
          }
        }
      }}
    >
      <PrivyAuthManager>{children}</PrivyAuthManager>
    </PrivyProvider>
  );
};
