import React, { useState, useEffect } from 'react';
import { Search, Flame } from 'lucide-react';
import MobileFooterNav from '../components/MobileFooterNav';
import ProfileCard from '../components/ProfileCard';
import { useLeaderboard, LeaderboardUser } from '../hooks/useLeaderboard';
import PageHeader from '../components/PageHeader';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import UserLevelBadge from '../components/UserLevelBadge';
import { formatCurrencyCompact } from '../utils/currency';

const Leaderboard: React.FC = () => {
  const { users, loading } = useLeaderboard();
  const [filteredUsers, setFilteredUsers] = useState<LeaderboardUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { currentUser } = useAuth();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const navigate = useNavigate();
  // These variables are kept for future implementation
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { wallet } = useWallet();

  // Format amount using Naira currency
  const formatAmount = (amount: number): string => {
    return formatCurrencyCompact(amount);
  };

  // Filter users based on search query
  useEffect(() => {
    if (!users || !users.length) {
      console.log('No users available for filtering');
      setFilteredUsers([]);
      return;
    }

    console.log(`Filtering ${users.length} users with query: "${searchQuery}"`);

    let result = [...users];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(user =>
        user.name.toLowerCase().includes(query) ||
        user.username.toLowerCase().includes(query)
      );
    }

    // Sort by rank by default
    result.sort((a, b) => a.rank - b.rank);

    setFilteredUsers(result);
  }, [users, searchQuery]);





  return (
    <div className="min-h-screen bg-white flex flex-col pb-[72px]">
      <PageHeader title="Rank" />

      <div className="w-full max-w-2xl mx-auto px-2 sm:px-4 py-4">
        <div className="flex-1 flex flex-col items-center w-full">
          {/* Search and Filters */}
          <div className="w-full mb-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#7440FF] focus:border-transparent"
              />
            </div>
          </div>







          {/* Leaderboard List */}
          <div className="w-full">
            {loading ? (
              <div className="flex flex-col gap-4 py-8">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex items-center bg-white rounded-2xl shadow-sm px-4 py-3 animate-pulse">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gray-200 mr-4" />
                    <div className="flex-1 min-w-0">
                      <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                      <div className="h-3 bg-gray-100 rounded w-1/2 mb-1" />
                      <div className="flex gap-2 mt-2">
                        <div className="h-3 w-8 bg-gray-100 rounded" />
                        <div className="h-3 w-8 bg-gray-100 rounded" />
                        <div className="h-3 w-12 bg-gray-100 rounded" />
                      </div>
                    </div>
                    <div className="w-20 h-8 bg-gray-200 rounded-full ml-4" />
                  </div>
                ))}
              </div>
            ) : filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <div
                  key={user.id}
                  onClick={() => setSelectedUserId(user.id)}
                  className="bg-white px-3 py-1.5 flex items-center gap-2 cursor-pointer border-b border-gray-100"
                >
                  {/* Rank */}
                  <div className="w-5 text-center font-bold text-gray-700">
                    {user.rank}
                  </div>

                  {/* Avatar with Level Badge */}
                  <div className="relative flex-shrink-0">
                    <img
                      src={user.avatar_url}
                      alt={user.name}
                      className="w-10 h-10 rounded-full object-cover cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedUserId(user.id);
                      }}
                    />

                    {/* Crown/Star for top 3 */}
                    {user.rank <= 3 && (
                      <div className={`absolute -top-1 -left-1 w-5 h-5 rounded-full flex items-center justify-center ${
                        user.rank === 1 ? 'bg-[#FFCC00]' :
                        user.rank === 2 ? 'bg-[#3B82F6]' :
                        'bg-[#F97316]'
                      }`}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 2L15 8L21 9L16.5 14L18 20L12 17L6 20L7.5 14L3 9L9 8L12 2Z" fill="white"/>
                        </svg>
                      </div>
                    )}

                    {/* Level badge for all users - smaller size */}
                    <div className="absolute -bottom-1 -right-1 transform scale-75 origin-bottom-right">
                      <UserLevelBadge
                        points={
                          user.rank === 1 ? 10000 :
                          user.rank === 2 ? 8000 :
                          user.rank === 3 ? 5000 :
                          user.rank === 4 ? 3000 :
                          user.rank === 5 ? 2000 :
                          user.rank === 6 ? 1000 :
                          user.rank === 7 ? 500 :
                          Math.max(100, user.points) // Ensure no user has level 0
                        }
                        size="sm"
                        showLabel={false}
                      />
                    </div>
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-900 truncate">{user.name}</span>
                      <span className="text-xs text-gray-400 truncate">
                        {user.username.length > 15
                          ? user.username.substring(0, 15) + '...'
                          : user.username}
                      </span>
                    </div>
                  </div>

                  {/* Points Badge */}
                  <div className="flex items-center mr-2">
                    <div className="bg-gray-100 rounded-full px-2 py-0.5">
                      <span className="text-xs font-bold">{user.points}</span>
                    </div>
                  </div>

                  {/* Earnings with Fire Icon - Using wallet balance */}
                  <div className="flex items-center gap-1 text-right">
                    <Flame className="w-3.5 h-3.5 text-red-500" />
                    <span className="text-sm font-medium text-gray-700">
                      {formatAmount(user.wallet_amount || 0)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-16">
                <img src="/empty-state.svg" alt="No Leaderboard data" className="w-32 h-32 mb-4 opacity-80" />
                <p className="text-lg font-semibold text-gray-700 mb-1">No users found</p>
                {searchQuery ? (
                  <p className="text-sm text-gray-400">Try a different search term</p>
                ) : (
                  <p className="text-sm text-gray-400">Users will appear here as they participate in events and challenges.</p>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                  }}
                  className="mt-4 px-4 py-2 bg-[#7440ff] text-white rounded-lg text-sm font-medium hover:bg-opacity-90 transition-colors"
                >
                  Reset Filters
                </button>
              </div>
            )}
          </div>
        </div>

        {selectedUserId && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
               onClick={(e) => {
                 // Only close if clicking the backdrop, not the card itself
                 if (e.target === e.currentTarget) {
                   console.log('Backdrop clicked, closing profile card');
                   setSelectedUserId(null);
                 }
               }}
          >
            <ProfileCard
              userId={selectedUserId}
              onClose={() => {
                console.log('Close button clicked, closing profile card');
                setSelectedUserId(null);
              }}
            />
          </div>
        )}
      </div>
      <MobileFooterNav />
    </div>
  );
};

export default Leaderboard;