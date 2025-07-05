import React, { useState, useEffect } from 'react';
import { X, Trophy, Users, TrendingUp, Star, Check } from 'lucide-react';
import { useProfile, Profile } from '../hooks/useProfile';
import LoadingSpinner from './LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';
import UserLevelBadge from './UserLevelBadge';
import UserAvatar from './UserAvatar';
import UserRankBadge from './UserRankBadge';

interface ModernProfileCardProps {
  profile?: Profile;
  userId?: string;
  onClose: () => void;
}

const ModernProfileCard: React.FC<ModernProfileCardProps> = ({ profile: initialProfile, userId, onClose }) => {
  const [profile, setProfile] = useState<Profile | null>(initialProfile || null);
  const { getProfile, followUser, unfollowUser, loadingProfile, loadingFollow, loadingUnfollow } = useProfile();
  const { currentUser } = useAuth();

  useEffect(() => {
    const loadProfile = async () => {
      if (userId) {
        const data = await getProfile(userId);
        if (data) {
          setProfile(data);
        }
      }
    };

    if (!initialProfile && userId) {
      loadProfile();
    }
  }, [userId, getProfile, initialProfile]);

  const handleFollow = async () => {
    if (!profile) return;

    const success = await followUser(profile.id);
    if (success) {
      setProfile(prev => prev ? {
        ...prev,
        followers_count: prev.followers_count + 1,
        is_following: true
      } : null);
    }
  };

  const handleUnfollow = async () => {
    if (!profile) return;

    const success = await unfollowUser(profile.id);
    if (success) {
      setProfile(prev => prev ? {
        ...prev,
        followers_count: prev.followers_count - 1,
        is_following: false
      } : null);
    }
  };

  if (loadingProfile || !profile) {
    return (
      <div className="bg-white rounded-2xl p-5 w-full max-w-sm shadow-lg border border-gray-100 relative">
        <div className="flex justify-center items-center h-40">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div 
      className="bg-white rounded-2xl w-full max-w-sm shadow-lg border border-gray-100 relative overflow-hidden"
      style={{ backgroundImage: 'url(/dialogue-bakcground.svg)', backgroundSize: 'cover' }}
    >
      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
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
              src={profile.avatar_url}
              alt={profile.name}
              size="xl"
              className="w-24 h-24 border-4 border-white shadow-md"
              points={profile.points || 0}
              showLevelBadge={true}
            />
            {profile.rank && (
              <div className="absolute -bottom-2 left-0">
                <UserRankBadge rank={profile.rank} size="md" />
              </div>
            )}
          </div>
        </div>

        {/* User info */}
        <div className="text-center mt-3">
          <h2 className="text-xl font-bold text-gray-900 mb-0.5">{profile.name}</h2>
          <p className="text-gray-500 text-sm">@{profile.username}</p>
          
          {/* Level and points */}
          <div className="flex items-center justify-center gap-2 mt-2 mb-3">
            <div className="flex items-center gap-1 px-2.5 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
              <Star className="w-3.5 h-3.5" />
              <span>{profile.points || 0} Points</span>
            </div>
            <UserLevelBadge points={profile.points || 0} size="sm" />
          </div>
          
          {/* Bio */}
          {profile.bio && (
            <p className="text-gray-700 text-sm mb-4 max-w-xs mx-auto">{profile.bio}</p>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-gray-50 rounded-lg p-2">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Trophy className="w-4 h-4 text-yellow-500" />
                <span className="font-semibold text-gray-900">{profile.stats?.events_won || 0}</span>
              </div>
              <p className="text-xs text-gray-500">Events Won</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-2">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Users className="w-4 h-4 text-blue-500" />
                <span className="font-semibold text-gray-900">{profile.followers_count}</span>
              </div>
              <p className="text-xs text-gray-500">Followers</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-2">
              <div className="flex items-center justify-center gap-1 mb-1">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="font-semibold text-gray-900">${profile.stats?.total_earnings || 0}</span>
              </div>
              <p className="text-xs text-gray-500">Earnings</p>
            </div>
          </div>

          {/* Follow button */}
          {currentUser && currentUser.id !== profile.id && (
            <button
              type="button"
              onClick={profile.is_following ? handleUnfollow : handleFollow}
              disabled={loadingFollow || loadingUnfollow}
              className={`w-full py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                profile.is_following
                  ? 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                  : 'bg-purple-600 text-white hover:bg-purple-700'
              }`}
            >
              {loadingFollow || loadingUnfollow ? (
                <LoadingSpinner size="sm" color={profile.is_following ? "#4B5563" : "#FFFFFF"} />
              ) : (
                <>
                  {profile.is_following && <Check className="w-4 h-4" />}
                  {profile.is_following ? 'Following' : 'Follow'}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModernProfileCard;
