import React, { useState } from 'react';
import { Trophy, Crown, Star, Users, Wallet } from 'lucide-react';
import MobileFooterNav from '../components/MobileFooterNav';
import ProfileCard from '../components/ProfileCard';
import { useLeaderboard } from '../hooks/useLeaderboard';
import PageHeader from '../components/PageHeader';
import { useNavigate } from 'react-router-dom';

const Leaderboard: React.FC = () => {
  const { users, loading } = useLeaderboard();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState<'all' | 'weekly' | 'monthly'>('all');
  const navigate = useNavigate();

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

  return (
    <div className="min-h-screen bg-[#F6F7FB] flex flex-col pb-[72px]">
      <PageHeader title="Leaderboard" />
      
      <div className="flex-1 flex flex-col items-center w-full">
        <div className="w-full max-w-2xl mx-auto px-2 sm:px-4 py-4">
          {/* Time Filter Tabs */}
          <div className="flex gap-1 mb-6 bg-white rounded-xl shadow-sm p-1 overflow-x-auto">
            {['all', 'weekly', 'monthly'].map((filter) => (
              <button
                key={filter}
                onClick={() => setTimeFilter(filter as any)}
                className={`px-3 py-1 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                  timeFilter === filter
                    ? 'bg-[#CCFF00] text-black shadow'
                    : 'bg-transparent text-gray-700 hover:bg-gray-100'}`}
                style={{ minWidth: 0 }}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>

          {/* Leaderboard List */}
          <div className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#CCFF00]" />
              </div>
            ) : users.length > 0 ? (
              users.map((user) => (
                <div
                  key={user.id}
                  onClick={() => setSelectedUserId(user.id)}
                  className="bg-white rounded-2xl shadow-sm px-4 py-3 transition border border-transparent hover:border-[#CCFF00]/40 cursor-pointer group flex items-center gap-3"
                >
                  {/* Avatar and Rank */}
                  <div className="relative flex-shrink-0">
                    <img
                      src={user.avatar_url}
                      alt={user.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div className={`absolute -bottom-1 -right-1 w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold ${getRankStyle(user.rank)}`}>
                      {user.rank}
                    </div>
                    {user.rank === 1 && (
                      <div className="absolute -top-1 -right-1">
                        <Crown className="w-4 h-4 text-[#CCFF00]" />
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
                        <Trophy className="w-3.5 h-3.5 text-[#CCFF00]" />
                        {user.events_won}
                      </span>
                      <span className="flex items-center gap-1 text-gray-500">
                        <Users className="w-3.5 h-3.5 text-[#CCFF00]" />
                        {user.groups_joined}
                      </span>
                      <span className="flex items-center gap-1 text-gray-500">
                        <Wallet className="w-3.5 h-3.5 text-[#CCFF00]" />
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
                <p className="text-sm text-gray-400">There are no users in the leaderboard yet.</p>
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