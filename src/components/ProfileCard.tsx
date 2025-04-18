import React, { useState, useEffect } from 'react';
import { X, Trophy, Users, TrendingUp, Star } from 'lucide-react';
import { useProfile, Profile } from '../hooks/useProfile';
import LoadingSpinner from './LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';
import UserLevelBadge from './UserLevelBadge';

interface ProfileCardProps {
  profile?: Profile;
  userId?: string;
  onClose: () => void;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ profile: initialProfile, userId, onClose }) => {
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
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-[#242538] rounded-2xl p-6 w-full max-w-md">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#242538] rounded-2xl p-6 w-full max-w-md relative">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-lg transition-colors"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="text-center">
        <img
          src={profile.avatar_url}
          alt={profile.name}
          className="w-24 h-24 rounded-full mx-auto mb-4"
        />
        <h2 className="text-xl font-bold mb-1">{profile.name}</h2>
        <p className="text-white/60">@{profile.username}</p>
        <div className="flex items-center justify-center gap-2 mt-2 mb-4">
          <div className="flex items-center gap-1 px-3 py-1 bg-purple-500/10 text-purple-500 rounded-full text-sm">
            <Star className="w-4 h-4" />
            <span>{profile.points || 0} Points</span>
          </div>
          <UserLevelBadge points={profile.points || 0} size="sm" />
        </div>
        {profile.bio && <p className="text-white/80 mb-6">{profile.bio}</p>}

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Trophy className="w-5 h-5 text-yellow-500 mr-2" />
              <span>{profile.stats?.events_won || 0}</span>
            </div>
            <p className="text-sm text-white/60">Events Won</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Users className="w-5 h-5 text-blue-500 mr-2" />
              <span>{profile.followers_count}</span>
            </div>
            <p className="text-sm text-white/60">Followers</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <TrendingUp className="w-5 h-5 text-green-500 mr-2" />
              <span>${profile.stats?.total_earnings || 0}</span>
            </div>
            <p className="text-sm text-white/60">Earnings</p>
          </div>
        </div>

        {currentUser && currentUser.id !== profile.id && (
          <button
            onClick={profile.is_following ? handleUnfollow : handleFollow}
            disabled={loadingFollow || loadingUnfollow}
            className={`w-full py-2 px-4 rounded-lg transition-colors ${
              profile.is_following
                ? 'btn-outline'
                : 'btn-primary'
            }`}
          >
            {loadingFollow || loadingUnfollow ? (
              <LoadingSpinner size="sm" />
            ) : (
              profile.is_following ? 'Unfollow' : 'Follow'
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default ProfileCard;
