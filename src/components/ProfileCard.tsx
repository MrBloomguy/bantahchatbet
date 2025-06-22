import React, { useState, useEffect } from 'react';
import { X, Trophy, Users, TrendingUp, Star, Send, Share2, UserPlus, UserMinus } from 'lucide-react';
import { useProfile, Profile } from '../hooks/useProfile';
import { useAuth } from '../contexts/AuthContext';
import UserLevelBadge from './UserLevelBadge';
import UserAvatar from './UserAvatar';
import { useWalletOperations } from '../hooks/useWalletOperations';
import { useWallet } from '../contexts/WalletContext';
import { useToast } from '../contexts/ToastContext';
import LoadingSpinner from './LoadingSpinner';

interface ProfileCardProps {
  profile?: Profile;
  userId?: string;
  onClose: () => void;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ profile: initialProfile, userId, onClose }) => {
  const [profile, setProfile] = useState<Profile | null>(initialProfile || null);
  const [showTipModal, setShowTipModal] = useState(false);
  const [tipAmount, setTipAmount] = useState('');
  const [processingTip, setProcessingTip] = useState(false);

  const { getProfile, followUser, unfollowUser, loadingProfile, loadingFollow, loadingUnfollow } = useProfile();
  const { currentUser } = useAuth();
  const { transfer, loading: transferLoading } = useWalletOperations();
  const { wallet } = useWallet();
  const toast = useToast();

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
      <div
        className="bg-white rounded-[2rem] w-full max-w-[320px] shadow-xl border overflow-hidden flex flex-col items-center p-0 min-h-[220px] relative"
        style={{ backgroundImage: 'none' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Share and Close buttons */}
        <div className="absolute top-2 right-2 flex gap-2 z-10">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toast.showInfo('Share Profile feature coming soon!');
            }}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Share profile"
            title="Share profile"
          >
            <Share2 className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close profile card"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {/* Skeleton Loader */}
        <div className="flex flex-col items-center w-full px-4 pt-6 pb-2 animate-pulse">
          {/* Avatar skeleton */}
          <div className="w-10 h-10 rounded-full bg-gray-200 mb-2" />
          {/* Name skeleton */}
          <div className="h-4 w-24 bg-gray-200 rounded mb-1" />
          {/* Username skeleton */}
          <div className="h-3 w-16 bg-gray-100 rounded mb-2" />
          {/* Badges row skeleton */}
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-4 bg-gray-100 rounded" />
            <div className="w-10 h-4 bg-gray-100 rounded" />
            <div className="w-10 h-4 bg-gray-100 rounded" />
            <div className="w-8 h-4 bg-gray-100 rounded" />
          </div>
        </div>
        {/* Bio skeleton */}
        <div className="h-3 w-40 bg-gray-100 rounded mb-2 mx-auto" />
        {/* Stats row skeleton */}
        <div className="grid grid-cols-3 gap-2 w-full px-4 mb-2">
          <div className="flex flex-col items-center bg-gray-50 rounded-lg py-2">
            <div className="h-4 w-8 bg-gray-200 rounded mb-1" />
            <div className="h-2 w-10 bg-gray-100 rounded" />
          </div>
          <div className="flex flex-col items-center bg-gray-50 rounded-lg py-2">
            <div className="h-4 w-8 bg-gray-200 rounded mb-1" />
            <div className="h-2 w-10 bg-gray-100 rounded" />
          </div>
          <div className="flex flex-col items-center bg-gray-50 rounded-lg py-2">
            <div className="h-4 w-8 bg-gray-200 rounded mb-1" />
            <div className="h-2 w-10 bg-gray-100 rounded" />
          </div>
        </div>
        {/* Actions skeleton */}
        <div className="flex gap-2 w-full px-4 mb-2">
          <div className="flex-1 h-8 bg-gray-200 rounded-full" />
          <div className="flex-1 h-8 bg-gray-200 rounded-full" />
          <div className="flex-1 h-8 bg-gray-200 rounded-full" />
        </div>
      </div>
    );
  }

  const handleTip = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profile) return;

    const amount = parseInt(tipAmount);

    if (isNaN(amount) || amount <= 0) {
      toast.showError('Please enter a valid amount');
      return;
    }

    if (!wallet || wallet.real_balance < amount) {
      toast.showError('Insufficient balance');
      return;
    }

    try {
      setProcessingTip(true);
      await transfer(profile.id, amount, 'real');
      toast.showSuccess(`Successfully sent ₦${amount} to ${profile.name}`);
      setShowTipModal(false);
      setTipAmount('');
    } catch (error: any) {
      toast.showError(error.message || 'Failed to send tip');
    } finally {
      setProcessingTip(false);
    }
  };

  return (
    <div
      className="bg-white rounded-[2rem] w-full max-w-[320px] shadow-xl border overflow-hidden flex flex-col items-center p-0 relative"
      style={{ backgroundImage: 'none' }}
      onClick={(e) => e.stopPropagation()} // Prevent event bubbling
    >
      {/* Share and Close buttons - Share left, Close right */}
      <div className="absolute top-3 left-3 z-20">
        <button
          type="button"
          onClick={async (e) => {
            e.stopPropagation();
            let url = window.location.origin;
            if (profile && profile.username) {
              url += `/profile?username=${profile.username}`;
            } else if (userId) {
              url += `/profile?userId=${userId}`;
            }
            await navigator.clipboard.writeText(url);
            toast.showSuccess('Profile link copied!');
          }}
          className="text-gray-400 hover:text-gray-600 p-1 rounded-full bg-white/80"
          aria-label="Share profile"
          title="Share profile"
        >
          <Share2 className="w-5 h-5" />
        </button>
      </div>
      <div className="absolute top-3 right-3 z-20">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="text-gray-400 hover:text-gray-600 p-1 rounded-full bg-white/80"
          aria-label="Close profile card"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      {/* Header: Avatar, Name, Username, Badges */}
      <div className="w-full flex flex-col items-center pt-6 pb-2 px-4 relative">
        <UserAvatar
          src={profile.avatar_url}
          alt={profile.name}
          size="md"
          badge={
            currentUser && currentUser.id !== profile.id ? (
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  if (profile.is_following) {
                    await handleUnfollow();
                  } else {
                    await handleFollow();
                  }
                }}
                disabled={loadingFollow || loadingUnfollow}
                className={`rounded-full bg-white shadow p-0.5 border border-gray-200 hover:bg-purple-100 transition-colors ${loadingFollow || loadingUnfollow ? 'opacity-60' : ''}`}
                title={profile.is_following ? 'Unfollow' : 'Follow'}
                aria-label={profile.is_following ? 'Unfollow' : 'Follow'}
                style={{ minWidth: 22, minHeight: 22, position: 'absolute', bottom: -6, right: -6 }}
              >
                {profile.is_following ? (
                  <UserMinus className="w-4 h-4 text-purple-600" />
                ) : (
                  <UserPlus className="w-4 h-4 text-purple-600" />
                )}
              </button>
            ) : null
          }
        />
        <h2 className="text-base font-semibold text-gray-800 mt-1">{profile.name}</h2>
        <p className="text-xs text-gray-400 mb-1">@{profile.username}</p>
        {/* Badges row (add leaderboard rank if available) */}
        <div className="flex items-center gap-2 mb-2">
          <span className="flex items-center gap-0.5 text-[11px] text-yellow-500" title="Points">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-500" strokeWidth={0} />
            {profile.points || 0}
          </span>
          <span className="flex items-center gap-0.5 text-[11px] text-blue-500" title="Followers">
            <Users className="w-4 h-4 text-blue-500" strokeWidth={2} />
            {profile.followers_count}
          </span>
          <span className="flex items-center gap-0.5 text-[11px] text-green-500" title="Earnings">
            <TrendingUp className="w-4 h-4 text-green-500" strokeWidth={2} />
            ₦{profile.stats?.total_earnings?.toLocaleString() || 0}
          </span>
          <span className="flex items-center gap-0.5 text-[11px] text-blue-500" title="Level">
            <UserLevelBadge points={profile.points || 0} size="xs" showLabel={false} />
          </span>
          {profile.rank && (
            <span className="flex items-center gap-0.5 text-[11px] text-purple-500" title="Leaderboard Rank">
              <Trophy className="w-4 h-4 text-purple-500" strokeWidth={2} />
              #{profile.rank}
            </span>
          )}
        </div>
      </div>
      {/* Bio */}
      {profile.bio && <p className="text-gray-700 text-xs text-center mb-2 max-w-xs px-2 leading-tight">{profile.bio}</p>}
      {/* Compact stats row above actions */}
      <div className="grid grid-cols-3 gap-2 w-full px-4 mb-2">
        <div className="flex flex-col items-center bg-gray-50 rounded-lg py-2">
          <span className="flex items-center gap-1 text-[12px] text-yellow-500 font-semibold">
            <Trophy className="w-4 h-4" />
            {profile.stats?.events_won || 0}
          </span>
          <span className="text-[10px] text-gray-500 mt-0.5">Events Won</span>
        </div>
        <div className="flex flex-col items-center bg-gray-50 rounded-lg py-2">
          <span className="flex items-center gap-1 text-[12px] text-blue-500 font-semibold">
            <Users className="w-4 h-4" />
            {profile.followers_count}
          </span>
          <span className="text-[10px] text-gray-500 mt-0.5">Followers</span>
        </div>
        <div className="flex flex-col items-center bg-gray-50 rounded-lg py-2">
          <span className="flex items-center gap-1 text-[12px] text-green-500 font-semibold">
            <TrendingUp className="w-4 h-4" />
            ₦{profile.stats?.total_earnings?.toLocaleString() || 0}
          </span>
          <span className="text-[10px] text-gray-500 mt-0.5">Earnings</span>
        </div>
      </div>
      {/* Actions - single row: Challenge, Message, Tip */}
      {currentUser && currentUser.id !== profile.id && (
        <div className="flex gap-2 w-full px-4 mb-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toast.showInfo('Challenge feature coming soon!');
            }}
            className="flex-1 py-1.5 rounded-full text-[13px] font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-200 flex items-center justify-center gap-1"
            aria-label="Challenge user"
            title="Challenge user"
          >
            <Trophy className="w-4 h-4" />
            Challenge
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toast.showInfo('Message feature coming soon!');
            }}
            className="flex-1 py-1.5 rounded-full text-[13px] font-medium bg-green-100 text-green-700 hover:bg-green-200 border border-green-200 flex items-center justify-center gap-1"
            aria-label="Message user"
            title="Message user"
          >
            <Send className="w-4 h-4" />
            Chat
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowTipModal(true);
            }}
            className="flex-1 py-1.5 rounded-full text-[13px] font-medium bg-[#CCFF00] text-black hover:bg-[#CCFF00]/90 border border-[#CCFF00] flex items-center justify-center gap-1"
            aria-label="Tip user"
            title="Tip user"
          >
            Tip
          </button>
        </div>
      )}
      {/* Tip Modal */}
      {showTipModal && profile && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowTipModal(false);
            }
          }}
        >
          <div
            className="bg-white rounded-xl max-w-xs w-full p-4 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowTipModal(false)}
              className="absolute right-3 top-3 p-1.5 bg-white/80 hover:bg-white rounded-full transition-colors"
              aria-label="Close modal"
              title="Close"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
            <div className="mb-4">
              <h3 className="text-lg font-bold text-gray-900">Tip {profile.name}</h3>
              <p className="text-sm text-gray-500">Send money to show your appreciation</p>
            </div>
            <form onSubmit={handleTip}>
              <div className="mb-4">
                <label htmlFor="tipAmount" className="block text-xs font-medium text-gray-700 mb-1">
                  Amount (₦)
                </label>
                <div className="relative">
                  <input
                    id="tipAmount"
                    type="number"
                    value={tipAmount}
                    onChange={(e) => setTipAmount(e.target.value)}
                    className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter amount"
                    min="1"
                    required
                  />
                  {wallet && (
                    <p className="text-[10px] text-gray-500 mt-1">
                      Your balance: <span className="font-medium">₦{wallet.real_balance.toLocaleString()}</span>
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowTipModal(false)}
                  className="flex-1 py-1.5 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors text-[13px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processingTip || !tipAmount || parseInt(tipAmount) <= 0}
                  className="flex-1 py-1.5 bg-[#CCFF00] text-black rounded-full hover:bg-[#CCFF00]/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-[13px]"
                >
                  {processingTip ? (
                    <LoadingSpinner size="sm" color="#000000" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Tip
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileCard;
