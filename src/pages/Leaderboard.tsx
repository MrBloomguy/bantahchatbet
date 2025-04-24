import React, { useState, useEffect } from 'react';
import { Trophy, Crown, Star, Users, Wallet, Medal, Search, Filter, ArrowUpDown } from 'lucide-react';
import MobileFooterNav from '../components/MobileFooterNav';
import ProfileCard from '../components/ProfileCard';
import { useLeaderboard, LeaderboardUser } from '../hooks/useLeaderboard';
import PageHeader from '../components/PageHeader';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Leaderboard: React.FC = () => {
  const { users, loading } = useLeaderboard();
  const [filteredUsers, setFilteredUsers] = useState<LeaderboardUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState<'all' | 'weekly' | 'monthly'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'rank' | 'events_won' | 'total_winnings'>('rank');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Filter and sort users based on current filters
  useEffect(() => {
    if (!users || !users.length) {
      console.log('No users available for filtering');
      setFilteredUsers([]);
      return;
    }

    console.log(`Filtering ${users.length} users with query: "${searchQuery}", filter: ${timeFilter}`);

    let result = [...users];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(user =>
        user.name.toLowerCase().includes(query) ||
        user.username.toLowerCase().includes(query)
      );
    }

    // Apply time filter (this is a placeholder - actual implementation would depend on your data structure)
    if (timeFilter !== 'all') {
      // This is just a placeholder filter - replace with actual time-based filtering logic
      let filteredResult = result;

      if (timeFilter === 'weekly') {
        // Filter to show only users active in the last week
        filteredResult = result.filter(user => user.points > 0);
      } else if (timeFilter === 'monthly') {
        // Filter to show only users active in the last month
        filteredResult = result.filter(user => user.events_won > 0);
      }

      // Only apply the filter if it doesn't remove all users
      if (filteredResult.length > 0) {
        result = filteredResult;
      } else {
        console.log(`Time filter '${timeFilter}' would remove all users, ignoring filter`);
      }
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'rank':
          comparison = a.rank - b.rank;
          break;
        case 'events_won':
          comparison = b.events_won - a.events_won;
          break;
        case 'total_winnings':
          comparison = b.total_winnings - a.total_winnings;
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredUsers(result);
  }, [users, searchQuery, timeFilter, sortBy, sortOrder]);

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-[#CCFF00] text-black";
      case 2:
        return "bg-[#7C3AED] text-white";
      case 3:
        return "bg-[#242538] text-white";
      default:
        return "bg-white/10 text-white/60";
    }
  };

  const getAchievementCount = (eventsWon: number) => {
    if (eventsWon >= 20) return 3;
    if (eventsWon >= 10) return 2;
    if (eventsWon >= 5) return 1;
    return 0;
  };

  // Function to highlight current user
  const isCurrentUser = (userId: string) => {
    return currentUser && currentUser.id === userId;
  };

  // Function to format currency
  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString()}`;
  };

  // Toggle sort order
  const handleSort = (field: 'rank' | 'events_won' | 'total_winnings') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F7FB] flex flex-col pb-[72px]">
      <PageHeader title="Leaderboard" />

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

          {/* Time Filter Tabs */}
          <div className="flex justify-center gap-1 mb-4 bg-white rounded-xl shadow-sm p-1 overflow-x-auto w-full">
            {['all', 'weekly', 'monthly'].map((filter) => (
              <button
                type="button"
                key={filter}
                onClick={() => setTimeFilter(filter as any)}
                className={`px-3 py-1 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                  timeFilter === filter
                    ? 'bg-[#7440ff] text-white shadow'
                    : 'bg-transparent text-gray-700 hover:bg-gray-100'}`}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>

          {/* Sort Options */}
          <div className="flex justify-between items-center mb-4 w-full">
            <div className="text-sm text-gray-500">
              {filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'} found
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Sort by:</span>
              <div className="flex bg-white rounded-lg shadow-sm overflow-hidden">
                <button
                  type="button"
                  onClick={() => handleSort('rank')}
                  className={`px-2 py-1 text-xs font-medium ${sortBy === 'rank' ? 'bg-[#7440ff]/10 text-[#7440ff]' : 'text-gray-600'}`}
                >
                  Rank {sortBy === 'rank' && <ArrowUpDown className="inline w-3 h-3 ml-1" />}
                </button>
                <button
                  type="button"
                  onClick={() => handleSort('events_won')}
                  className={`px-2 py-1 text-xs font-medium ${sortBy === 'events_won' ? 'bg-[#7440ff]/10 text-[#7440ff]' : 'text-gray-600'}`}
                >
                  Wins {sortBy === 'events_won' && <ArrowUpDown className="inline w-3 h-3 ml-1" />}
                </button>
                <button
                  type="button"
                  onClick={() => handleSort('total_winnings')}
                  className={`px-2 py-1 text-xs font-medium ${sortBy === 'total_winnings' ? 'bg-[#7440ff]/10 text-[#7440ff]' : 'text-gray-600'}`}
                >
                  Earnings {sortBy === 'total_winnings' && <ArrowUpDown className="inline w-3 h-3 ml-1" />}
                </button>
              </div>
            </div>
          </div>

          {/* Top 3 Users */}
          {!loading && filteredUsers.length > 0 && (
            <div className="w-full mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">Top Players</h2>
              <div className="flex justify-center gap-4">
                {filteredUsers.slice(0, 3).map((user, index) => (
                  <div
                    key={user.id}
                    onClick={() => setSelectedUserId(user.id)}
                    className={`flex-1 flex flex-col items-center p-3 rounded-xl cursor-pointer transition-transform hover:scale-105 ${
                      index === 0 ? 'bg-gradient-to-b from-[#CCFF00]/20 to-[#CCFF00]/5 border border-[#CCFF00]/30' :
                      index === 1 ? 'bg-gradient-to-b from-[#7C3AED]/20 to-[#7C3AED]/5 border border-[#7C3AED]/30' :
                      'bg-gradient-to-b from-[#242538]/20 to-[#242538]/5 border border-[#242538]/30'
                    } ${isCurrentUser(user.id) ? 'ring-2 ring-[#CCFF00]' : ''}`}
                  >
                    <div className="relative mb-2">
                      <img
                        src={user.avatar_url}
                        alt={user.name}
                        className="w-16 h-16 rounded-full object-cover border-2 border-white"
                      />
                      <div className="absolute -bottom-1 -right-1">
                        {index === 0 ? (
                          <div className="bg-[#CCFF00] p-1 rounded-full">
                            <Crown className="w-4 h-4 text-black" />
                          </div>
                        ) : (
                          <div className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${getRankStyle(index + 1)}`}>
                            {index + 1}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-gray-900 truncate max-w-[80px]">{user.name}</p>
                      <p className="text-xs text-gray-500 truncate max-w-[80px]">@{user.username}</p>
                      <div className="flex items-center justify-center gap-1 mt-1">
                        <Trophy className="w-3 h-3 text-[#CCFF00]" />
                        <span className="text-xs font-medium">{user.events_won}</span>
                      </div>
                      <p className="text-xs font-medium text-gray-700 mt-1">{formatCurrency(user.total_winnings)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Leaderboard List */}
          <div className="space-y-3 w-full">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#CCFF00]" />
              </div>
            ) : filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <div
                  key={user.id}
                  onClick={() => setSelectedUserId(user.id)}
                  className={`bg-white rounded-xl shadow-sm px-4 py-3 transition border ${
                    isCurrentUser(user.id)
                      ? 'border-[#CCFF00] bg-[#CCFF00]/5'
                      : 'border-transparent hover:border-[#CCFF00]/40'
                  } cursor-pointer group flex items-center gap-3`}
                >
                  {/* Rank */}
                  <div className={`w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-full text-xs font-bold ${getRankStyle(user.rank)}`}>
                    {user.rank}
                  </div>

                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <img
                      src={user.avatar_url}
                      alt={user.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    {user.rank <= 3 && (
                      <div className="absolute -top-1 -right-1">
                        {user.rank === 1 ? (
                          <Crown className="w-4 h-4 text-[#CCFF00]" />
                        ) : (
                          <Medal className="w-4 h-4 text-[#7440ff]" />
                        )}
                      </div>
                    )}
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900 truncate">{user.name}</span>
                      <span className="text-sm text-gray-500">@{user.username}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs mt-1">
                      <span className="flex items-center gap-1 text-gray-500">
                        <Trophy className="w-3.5 h-3.5 text-[#7440ff]" />
                        {user.events_won}
                      </span>
                      <span className="flex items-center gap-1 text-gray-500">
                        <Users className="w-3.5 h-3.5 text-[#7440ff]" />
                        {user.groups_joined}
                      </span>
                      <span className="flex items-center gap-1 text-gray-500">
                        <Wallet className="w-3.5 h-3.5 text-[#7440ff]" />
                        ₦{user.total_winnings.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Achievement Stars */}
                  <div className="flex items-center gap-0.5">
                    {[...Array(getAchievementCount(user.events_won))].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-[#CCFF00] fill-[#CCFF00]" />
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-16">
                <img src="/noti-lonely.svg" alt="No Leaderboard data" className="w-32 h-32 mb-4 opacity-80" />
                <p className="text-lg font-semibold text-gray-700 mb-1">No users found</p>
                {searchQuery ? (
                  <p className="text-sm text-gray-400">Try a different search term</p>
                ) : timeFilter !== 'all' ? (
                  <p className="text-sm text-gray-400">Try changing the time filter to 'All'</p>
                ) : (
                  <p className="text-sm text-gray-400">Users will appear here as they participate in events and challenges.</p>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setTimeFilter('all');
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
          <ProfileCard
            userId={selectedUserId}
            onClose={() => setSelectedUserId(null)}
          />
        )}
      </div>
      <MobileFooterNav />
    </div>
  );
};

export default Leaderboard;