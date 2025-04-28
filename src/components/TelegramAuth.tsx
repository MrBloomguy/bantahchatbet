import React, { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

interface TelegramAuthProps {
  onSuccess?: (userData: any) => void;
  onError?: (error: any) => void;
  buttonSize?: 'large' | 'medium' | 'small';
  cornerRadius?: number;
  requestAccess?: 'write' | 'read';
  usePic?: boolean;
  botId?: string;
}

declare global {
  interface Window {
    TelegramLoginWidget: {
      dataOnauth: (user: any) => void;
    };
  }
}

const TelegramAuth: React.FC<TelegramAuthProps> = ({
  onSuccess,
  onError,
  buttonSize = 'large',
  cornerRadius = 20,
  requestAccess = 'write',
  usePic = true,
  botId = 'bantahchatbot'
}) => {
  const { refreshUser } = useAuth();
  const toast = useToast();
  const telegramRef = useRef<HTMLDivElement>(null);
  const widgetId = `telegram-login-${botId}`;

  useEffect(() => {
    // Create script element for Telegram widget
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-login', botId);
    script.setAttribute('data-size', buttonSize);
    script.setAttribute('data-radius', cornerRadius.toString());
    script.setAttribute('data-request-access', requestAccess);
    script.setAttribute('data-userpic', usePic.toString());
    script.setAttribute('data-onauth', 'TelegramLoginWidget.dataOnauth(user)');
    script.async = true;

    // Add the script to the container
    if (telegramRef.current) {
      telegramRef.current.appendChild(script);
    }

    // Define the callback function
    window.TelegramLoginWidget = {
      dataOnauth: async (user) => {
        try {
          console.log('Telegram auth successful:', user);
          if (!user || !user.id) {
            throw new Error('Invalid user data from Telegram');
          }
          // Create a unique ID based on the Telegram ID
          const userId = uuidv4();
          // Create a username based on Telegram data
          const username = `tg_${user.username || user.first_name.toLowerCase()}_${user.id.toString().substring(0, 6)}`;
          // Create a user object
          const newUser = {
            id: userId,
            name: `${user.first_name} ${user.last_name || ''}`.trim(),
            username: username.replace(/[^a-z0-9_]/g, '_'),
            avatar_url: user.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
            bio: `Telegram user (@${user.username || user.first_name})`,
            telegram_id: user.id.toString(),
            telegram_username: user.username,
            is_telegram_auth: true,
            reputation_score: 0,
            points: 0
          };
          // Check if user already exists by Telegram ID
          const { data: existingUser, error: fetchError } = await supabase
            .from('users')
            .select('*')
            .eq('telegram_id', user.id.toString())
            .maybeSingle();
          if (fetchError && fetchError.code !== 'PGRST116') {
            console.error('Error checking for existing user:', fetchError);
            throw fetchError;
          }
          if (existingUser) {
            // User exists, update last login
            const { error: updateError } = await supabase
              .from('users')
              .update({ updated_at: new Date().toISOString() })
              .eq('id', existingUser.id);
            if (updateError) {
              console.error('Error updating user:', updateError);
              throw updateError;
            }
            refreshUser({ ...existingUser, points: existingUser.reputation_score || 0, is_telegram_auth: true });
            toast.showSuccess('Signed in with Telegram successfully!');
            if (onSuccess) onSuccess(existingUser);
          } else {
            // Create new user
            const { data: insertedUser, error: insertError } = await supabase
              .from('users')
              .insert({
                id: userId,
                name: newUser.name,
                username: newUser.username,
                avatar_url: newUser.avatar_url,
                bio: newUser.bio,
                telegram_id: user.id.toString(),
                telegram_username: user.username,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                reputation_score: 0
              })
              .select()
              .single();
            if (insertError) {
              console.error('Error creating user:', insertError);
              throw insertError;
            }
            refreshUser({ ...insertedUser, points: 0, is_telegram_auth: true });
            toast.showSuccess('Account created with Telegram successfully!');
            if (onSuccess) onSuccess(insertedUser);
          }
        } catch (error) {
          console.error('Telegram auth error:', error);
          toast.showError('Failed to authenticate with Telegram');
          if (onError) onError(error);
        }
      }
    };
    // Clean up
    return () => {
      if (telegramRef.current) {
        const scriptElement = telegramRef.current.querySelector('script');
        if (scriptElement) {
          telegramRef.current.removeChild(scriptElement);
        }
      }
    };
  }, [botId, buttonSize, cornerRadius, requestAccess, usePic, onSuccess, onError, refreshUser, toast]);

  return <div ref={telegramRef} id={widgetId} className="telegram-login-widget"></div>;
};

export default TelegramAuth;
