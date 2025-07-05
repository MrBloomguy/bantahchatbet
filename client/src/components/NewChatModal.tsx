import React, { useState, useCallback, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../hooks/useChat';
import { useToast } from '../contexts/ToastContext';
import UserAvatar from './UserAvatar';
import LoadingSpinner from './LoadingSpinner';
import { supabase } from '../lib/supabase';

interface User {
  id: string;
  name: string | null;
  username: string | null;
  avatar_url: string | null;
  status?: 'online' | 'offline' | 'away' | 'sleeping';
}

interface NewChatModalProps {
  onClose: () => void;
  onChatCreated: (chat: Chat) => void;
}

const NewChatModal: React.FC<NewChatModalProps> = ({ onClose, onChatCreated }) => {
  const [search, setSearch] = useState('');
  const { currentUser } = useAuth();
  const { createPrivateChat } = useChat();
  const toast = useToast();
  const [creating, setCreating] = useState(false);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);

  const searchUsers = useCallback(async (query: string) => {
    if (!query.trim() || !currentUser?.id) return [];

    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, username, avatar_url, status')
        .neq('id', currentUser.id)
        .or(`username.ilike.%${query}%,name.ilike.%${query}%`)
        .order('username')
        .limit(20);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching users:', error);
      toast.showError('Failed to search users');
      return [];
    }
  }, [currentUser?.id, toast]);

  const handleSelectUser = async (userId: string) => {
    if (creating) return;
    
    try {
      setCreating(true);
      const chat = await createPrivateChat(userId);
      if (chat) {
        onChatCreated(chat);
        onClose();
        toast.showSuccess('Chat created successfully');
      }
    } catch (error) {
      console.error('Failed to create chat:', error);
      toast.showError('Failed to create chat');
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (search.trim()) {
        setSearching(true);
        searchUsers(search)
          .then(setSearchResults)
          .finally(() => setSearching(false));
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [search, searchUsers]);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-lg font-semibold">New Message</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          <div className="relative">
            <div className="flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg">
              <Search className="w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 ml-2 bg-transparent outline-none"
              />
              {searching && <LoadingSpinner size="sm" />}
            </div>
          </div>

          <div className="mt-4 space-y-2 max-h-[60vh] overflow-y-auto">
            {searchResults.map((user) => (
              <button
                key={user.id}
                onClick={() => handleSelectUser(user.id)}
                disabled={creating}
                className="w-full p-3 flex items-center space-x-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <UserAvatar
                  url={user.avatar_url}
                  name={user.name || user.username || ''}
                  status={user.status}
                />
                <div className="flex-1 text-left">
                  <p className="font-medium">{user.name}</p>
                  <p className="text-sm text-gray-500">@{user.username}</p>
                </div>
              </button>
            ))}
            
            {search && !searching && searchResults.length === 0 && (
              <p className="text-center text-gray-500 py-4">No users found</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewChatModal;