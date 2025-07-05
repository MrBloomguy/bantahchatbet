import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import LoadingSpinner from './LoadingSpinner';

interface TikTokLoginProps {
  onClose?: () => void;
}

// Function to generate a random string for PKCE
function generateRandomString(length: number): string {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  let text = '';
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

// Function to create a code challenge from a code verifier
async function generateCodeChallenge(codeVerifier: string): Promise<string> {
  // Hash the code verifier using SHA-256
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await window.crypto.subtle.digest('SHA-256', data);

  // Convert the hash to base64-url format
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

const TikTokLogin: React.FC<TikTokLoginProps> = ({ onClose }) => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const toast = useToast();

  // Mock TikTok login for demo purposes
  const handleTikTokLogin = async () => {
    console.log('TikTok Login: Button clicked');
    setLoading(true);

    try {
      // For demo purposes, we'll simulate the TikTok login flow
      toast.showInfo('Simulating TikTok login for demo purposes');

      // Simulate a delay for the authorization process
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Create a mock TikTok user
      const mockTikTokUser = {
        open_id: 'tiktok_' + Math.random().toString(36).substring(2, 10),
        union_id: 'union_' + Math.random().toString(36).substring(2, 10),
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=tiktok',
        display_name: 'TikTok_User_' + Math.random().toString(36).substring(2, 5)
      };

      console.log('TikTok Login: Created mock user for demo:', mockTikTokUser);

      // Simulate creating or updating the user in your database
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('tiktok_id', mockTikTokUser.open_id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (!existingUser) {
        // Create new user
        console.log('TikTok Login: Creating new user');
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert([
            {
              tiktok_id: mockTikTokUser.open_id,
              name: mockTikTokUser.display_name,
              avatar_url: mockTikTokUser.avatar_url,
              auth_provider: 'tiktok'
            }
          ])
          .select()
          .single();

        if (createError) throw createError;

        console.log('TikTok Login: New user created:', newUser);

        // Sign in the user
        await refreshUser(newUser);
      } else {
        // User exists, update their info
        console.log('TikTok Login: Updating existing user');
        const { error: updateError } = await supabase
          .from('users')
          .update({
            name: mockTikTokUser.display_name,
            avatar_url: mockTikTokUser.avatar_url,
            last_login: new Date().toISOString()
          })
          .eq('tiktok_id', mockTikTokUser.open_id);

        if (updateError) throw updateError;

        console.log('TikTok Login: User updated:', existingUser);

        // Sign in the user
        await refreshUser(existingUser);
      }

      // Show success message
      toast.showSuccess('Successfully signed in with TikTok (Demo)');

      // Navigate to home page
      navigate('/');
    } catch (error) {
      console.error('TikTok Login: Error during mock authentication:', error);
      toast.showError('Failed to simulate TikTok login. Please try again.');
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleTikTokLogin}
      disabled={loading}
      className="w-full flex items-center justify-center gap-2 bg-black hover:bg-gray-900 active:bg-gray-800 text-white font-medium py-2 px-3 rounded-full transition-all duration-200 text-sm font-sans shadow-md hover:shadow-lg border border-gray-800"
    >
      {loading ? (
        <LoadingSpinner size="sm" color="#FFFFFF" />
      ) : (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="white">
            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
          </svg>
          Sign in with TikTok (Demo)
        </>
      )}
    </button>
  );
};

export default TikTokLogin;
