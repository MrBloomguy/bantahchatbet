import React, { useState, useCallback, useEffect } from 'react';
import { X, Search, UserPlus, Ban } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from '../contexts/ToastContext';
import UserAvatar from './UserAvatar';
import LoadingSpinner from './LoadingSpinner';

interface User {
  id: string;
  name: string | null;
  username: string | null;
  avatar_url: string | null;
}

interface UserSearchModalProps {
  onClose: () => void;
  eventId: string;
  onUserAction: (userId: string, action: 'ban' | 'mod') => Promise<void>;
}

const UserSearchModal: React.FC<UserSearchModalProps> = ({ onClose, eventId, onUserAction }) => {
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const searchUsers = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('id, name, username, avatar_url')
        .or(`username.ilike.%${query}%,name.ilike.%${query}%`)
        .order('username')
        .limit(10);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching users:', error);
      toast.showError('Failed to search users');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchUsers(search);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [search, searchUsers]);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-[#242538] rounded-lg w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">Search Users</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-white" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value.trim())}
              placeholder="Search by username or name"
              className="w-full bg-[#242538] text-white pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CCFF00] placeholder-white/40"
            />
          </div>
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center p-4">
              <LoadingSpinner size="md" />
            </div>
          ) : searchResults.length === 0 ? (
            <div className="text-center p-4 text-white/60">
              {search.trim() ? 'No users found' : 'Start typing to search users'}
            </div>
          ) : (
            <div className="p-2">
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-2 hover:bg-white/5 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <UserAvatar
                      src={user.avatar_url || ''}
                      alt={user.username || ''}
                      size="md"
                    />
                    <div>
                      <div className="text-white font-medium">
                        {user.name || user.username}
                      </div>
                      {user.username && (
                        <div className="text-sm text-white/60">
                          @{user.username}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onUserAction(user.id, 'mod')}
                      className="p-2 hover:bg-[#CCFF00]/10 rounded-full transition-colors"
                      title="Make moderator"
                    >
                      <UserPlus className="h-4 w-4 text-[#CCFF00]" />
                    </button>
                    <button
                      onClick={() => onUserAction(user.id, 'ban')}
                      className="p-2 hover:bg-red-500/10 rounded-full transition-colors"
                      title="Ban user"
                    >
                      <Ban className="h-4 w-4 text-red-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserSearchModal;

