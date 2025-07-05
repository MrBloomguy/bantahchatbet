import React from 'react';
import { X, Trophy, Users, TrendingUp, Star } from 'lucide-react';
import UserLevelBadge from './UserLevelBadge';
import UserAvatar from './UserAvatar';
import UserRankBadge from './UserRankBadge';

interface ProfileCardDemoProps {
  user: {
    id: string;
    name: string;
    username: string;
    avatar_url?: string;
    bio?: string;
    points?: number;
    rank?: string;
    followers_count?: number;
    stats?: {
      events_won?: number;
      total_earnings?: number;
    };
  };
  onClose: () => void;
}

const ProfileCardDemo: React.FC<ProfileCardDemoProps> = ({ user, onClose }) => {
  return (
    <div
      className="bg-white rounded-2xl w-full max-w-sm shadow-lg border border-gray-100 relative overflow-hidden"
      style={{ backgroundImage: 'url(/dialogue-bakcground.svg)', backgroundSize: 'cover' }}
    >
      {/* Close button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation(); // Prevent event bubbling
          console.log('Close button in ProfileCardDemo clicked');
          onClose();
        }}
        className="absolute top-3 right-3 p-1.5 bg-white/80 hover:bg-white rounded-full transition-colors z-10"
        aria-label="Close profile card"
        title="Close"
      >
        <X className="w-4 h-4 text-gray-600" />
      </button>

      {/* Cover image/gradient */}
      <div className="h-24 bg-gradient-to-r from-purple-500 to-blue-500"></div>

      {/* Profile content */}
      <div className="px-5 pb-5 -mt-12">
        {/* Avatar */}
        <div className="relative flex justify-center">
          <div className="relative">
            <UserAvatar
              src={user.avatar_url || '/avatar.svg'}
              alt={user.name}
              size="xl"
              className="w-24 h-24 border-4 border-white shadow-md"
              points={user.points || 0}
              showLevelBadge={true}
            />
            {user.rank && (
              <div className="absolute -bottom-2 left-0">
                <UserRankBadge rank={user.rank} size="md" />
              </div>
            )}
          </div>
        </div>

        {/* User info */}
        <div className="text-center mt-3">
          <h2 className="text-xl font-bold text-gray-900 mb-0.5">{user.name}</h2>
          <p className="text-gray-500 text-sm">@{user.username}</p>

          {/* Level and points */}
          <div className="flex items-center justify-center gap-2 mt-2 mb-3">
            <div className="flex items-center gap-1 px-2.5 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
              <Star className="w-3.5 h-3.5" />
              <span>{user.points || 0} Points</span>
            </div>
            <UserLevelBadge points={user.points || 0} size="sm" />
          </div>

          {/* Bio */}
          {user.bio && (
            <p className="text-gray-700 text-sm mb-4 max-w-xs mx-auto">{user.bio}</p>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-gray-50 rounded-lg p-2">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Trophy className="w-4 h-4 text-yellow-500" />
                <span className="font-semibold text-gray-900">{user.stats?.events_won || 0}</span>
              </div>
              <p className="text-xs text-gray-500">Events Won</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-2">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Users className="w-4 h-4 text-blue-500" />
                <span className="font-semibold text-gray-900">{user.followers_count || 0}</span>
              </div>
              <p className="text-xs text-gray-500">Followers</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-2">
              <div className="flex items-center justify-center gap-1 mb-1">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="font-semibold text-gray-900">${user.stats?.total_earnings || 0}</span>
              </div>
              <p className="text-xs text-gray-500">Earnings</p>
            </div>
          </div>

          {/* View Profile Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation(); // Prevent event bubbling
              console.log('View Profile button clicked');
              // Use navigate instead of direct location change to avoid page reload
              window.location.href = `/profile/${user.username}`;
            }}
            className="w-full py-2 px-4 rounded-lg transition-colors bg-purple-600 text-white hover:bg-purple-700"
          >
            View Full Profile
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileCardDemo;
