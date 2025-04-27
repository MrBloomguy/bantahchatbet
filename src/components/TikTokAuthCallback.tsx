import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import LoadingSpinner from './LoadingSpinner';

const TikTokAuthCallback: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const toast = useToast();

  useEffect(() => {
    const handleTikTokAuth = async () => {
      try {
        console.log('TikTok Callback: Processing authentication response');

        // Parse URL parameters
        const urlParams = new URLSearchParams(location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const error = urlParams.get('error');
        const errorDescription = urlParams.get('error_description');

        // Handle error from TikTok
        if (error) {
          console.error('TikTok Callback: Auth error:', error, errorDescription);
          setError(errorDescription || 'Authentication failed');
          toast.showError(errorDescription || 'TikTok authentication failed');
          setTimeout(() => navigate('/signin'), 3000);
          return;
        }

        // Validate code and state
        if (!code) {
          console.error('TikTok Callback: Missing code parameter');
          setError('Invalid authentication response: missing code');
          toast.showError('Invalid authentication response');
          setTimeout(() => navigate('/signin'), 3000);
          return;
        }

        // For demo purposes, we're not verifying the state parameter
        // In production, you would verify the state to prevent CSRF attacks

        // Use the fixed code verifier (same as in TikTokLogin.tsx)
        const codeVerifier = "bantah_tiktok_code_verifier_1234567890_abcdefghijklmnopqrstuvwxyz";

        console.log('TikTok Callback: Code received, using fixed code verifier for demo');

        // In a real implementation, you would send the code and code_verifier to your backend
        // Your backend would exchange it for an access token using your client secret and the code verifier

        // For demo purposes, we'll simulate a successful authentication
        console.log('TikTok Callback: Simulating token exchange for code:', code, 'with code verifier:', codeVerifier.substring(0, 10) + '...');

        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Simulate successful authentication with mock user data
        // In production, you would get this data from the TikTok API
        const mockTikTokUser = {
          open_id: 'tiktok_' + Math.random().toString(36).substring(2, 10),
          union_id: 'union_' + Math.random().toString(36).substring(2, 10),
          avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=tiktok',
          display_name: 'TikTok_User_' + Math.random().toString(36).substring(2, 5)
        };

        console.log('TikTok Callback: Mock user created:', mockTikTokUser);

        // Check if user exists in your database
        console.log('TikTok Callback: Checking if user exists in database');
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
          console.log('TikTok Callback: Creating new user');
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

          console.log('TikTok Callback: New user created:', newUser);

          // In production, you would sign in the user with your auth system
          await refreshUser(newUser);
        } else {
          // User exists, update their info
          console.log('TikTok Callback: Updating existing user');
          const { error: updateError } = await supabase
            .from('users')
            .update({
              name: mockTikTokUser.display_name,
              avatar_url: mockTikTokUser.avatar_url,
              last_login: new Date().toISOString()
            })
            .eq('tiktok_id', mockTikTokUser.open_id);

          if (updateError) throw updateError;

          console.log('TikTok Callback: User updated:', existingUser);

          // In production, you would sign in the user with your auth system
          await refreshUser(existingUser);
        }

        console.log('TikTok Callback: Authentication successful');
        toast.showSuccess('Successfully signed in with TikTok');

        // Redirect to home page after successful authentication
        setTimeout(() => navigate('/'), 1500);
      } catch (err: any) {
        console.error('TikTok Callback: Error handling auth:', err);
        setError('Authentication failed. Please try again.');
        toast.showError('Authentication failed. Please try again.');
        setTimeout(() => navigate('/signin'), 3000);
      } finally {
        setLoading(false);
      }
    };

    handleTikTokAuth();
  }, [location, navigate, refreshUser, toast]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Processing your TikTok login...</p>
          <p className="mt-2 text-gray-400 text-sm">This may take a moment</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Authentication Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-gray-500 text-sm">Redirecting you back to sign in...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
        <div className="text-green-500 text-5xl mb-4">✓</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Authentication Successful</h2>
        <p className="text-gray-600 mb-4">You have successfully signed in with TikTok.</p>
        <p className="text-gray-500 text-sm">Redirecting you to the dashboard...</p>
      </div>
    </div>
  );
};

export default TikTokAuthCallback;
