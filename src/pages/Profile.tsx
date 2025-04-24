import React from 'react';
import { ChevronRight, Wallet, Trophy, Users, TrendingUp, BarChart2, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import MobileFooterNav from '../components/MobileFooterNav';
import UserRankBadge from '../components/UserRankBadge';
import PageHeader from '../components/PageHeader';
import UserLevelBadge from '../components/UserLevelBadge';
import UserAvatar from '../components/UserAvatar';

const Profile: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const { wallet } = useWallet();
  const navigate = useNavigate();

  const stats = [
    // All stats cards removed
  ];

  const menuItems = [
    {
      label: 'Profile Settings',
      path: '/settings/profile'
    },
    {
      label: 'Levels & Badges',
      path: '/levels'
    },
    {
      label: 'Settings',
      path: '/settings'
    },
    {
      label: 'Refer & Earn',
      path: '/referral'
    },
    {
      label: 'Privacy & Security',
      path: '/settings/privacy'
    },
    {
      label: 'Help & Support',
      path: '/help'
    }
  ];

  const handleShare = async () => {
    try {
      await navigator.share({
        title: `${currentUser?.username}'s Profile`,
        text: `Check out my profile on Bantah!`,
        url: window.location.href
      });
    } catch (err) {
      console.log('Error sharing:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F7FB] flex flex-col pb-[70px]">
      <PageHeader title="Profile" />
      <div className="flex-1 flex flex-col items-center w-full">
        <div className="w-full max-w-xl mx-auto px-2 sm:px-4 py-4">
          {/* Profile Card */}
          <div className="relative bg-white rounded-3xl px-6 pt-8 pb-6 mb-6 border border-[#f0f1fa] shadow-sm">
            {/* Top section with actions */}
            <div className="flex justify-end mb-4">
              <button
                type="button"
                onClick={async () => {
                  if (currentUser?.referral_code) {
                    await navigator.clipboard.writeText(currentUser.referral_code);
                    // Show feedback/toast
                    if (window?.toast) {
                      window.toast('Referral code copied!', { type: 'success' });
                    } else if (typeof window !== 'undefined') {
                      alert('Referral code copied!');
                    }
                  }
                }}
                className="flex items-center gap-1 bg-[#F6F7FB] px-3 py-1.5 rounded-full text-[#7440ff] text-xs font-semibold hover:bg-[#CCFF00]/20 transition border border-[#7440ff]"
                title="Copy Referral Code"
                aria-label="Copy Referral Code"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 17l4 4 4-4m0-5V3a1 1 0 00-1-1h-6a1 1 0 00-1 1v9m0 0l4 4 4-4" />
                </svg>
                <span>{currentUser?.referral_code ? currentUser.referral_code.slice(0, 8) : 'Refer'}</span>
              </button>
            </div>

            {/* Profile info section */}
            <div className="flex flex-col items-center">
              {/* Avatar with badges */}
              <div className="relative mb-4">
                <UserAvatar
                  src={currentUser?.avatar_url || '/avatar.svg'}
                  alt={currentUser?.name || 'User'}
                  size="xl"
                  className="w-28 h-28 border-4 border-white shadow-md"
                  points={currentUser?.points || 0}
                  showLevelBadge={true}
                />

                {/* Edit profile button */}
                <button
                  type="button"
                  onClick={() => navigate('/settings/profile')}
                  className="absolute bottom-0 right-0 p-2 rounded-full bg-[#CCFF00] text-black shadow hover:bg-[#e6ff70] transition"
                  aria-label="Edit Profile"
                  title="Edit Profile"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 3.5a2.121 2.121 0 113 3L7 19.5 3 21l1.5-4L16.5 3.5z" />
                  </svg>
                </button>

                {/* Rank badge */}
                {currentUser?.rank && (
                  <div className="absolute -bottom-2 left-0">
                    <UserRankBadge rank={currentUser.rank} size="lg" />
                  </div>
                )}
              </div>

              {/* User info */}
              <h2 className="text-2xl font-bold text-gray-900 mb-1 tracking-tight">{currentUser?.name}</h2>
              <p className="text-gray-500 text-base mb-3">@{currentUser?.username}</p>

              {/* Bio section */}
              {currentUser?.bio && (
                <p className="text-gray-700 text-center mb-4 max-w-xs leading-relaxed">{currentUser.bio}</p>
              )}

              {/* Stats section */}
              <div className="flex items-center justify-center gap-4 w-full mb-2">
                {/* Level badge */}
                <div className="flex flex-col items-center">
                  <UserLevelBadge points={currentUser?.points || 0} size="md" />
                  <span className="text-xs text-gray-500 mt-1">Level</span>
                </div>

                {/* Points */}
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-1 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full">
                    <Star className="w-4 h-4" />
                    <span className="font-medium">{currentUser?.points || 0}</span>
                  </div>
                  <span className="text-xs text-gray-500 mt-1">Points</span>
                </div>

                {/* Followers */}
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full">
                    <Users className="w-4 h-4" />
                    <span className="font-medium">{currentUser?.followers_count || 0}</span>
                  </div>
                  <span className="text-xs text-gray-500 mt-1">Followers</span>
                </div>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="bg-white rounded-2xl shadow divide-y divide-gray-100 mb-10 overflow-hidden border border-[#f0f1fa]">
            {menuItems.map((item, index) => (
              <button
                type="button"
                key={index}
                onClick={() => navigate(item.path)}
                className="w-full flex items-center justify-between px-5 py-4 text-gray-900 hover:bg-[#F6F7FB] transition text-base font-medium"
              >
                <span>{item.label}</span>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            ))}
          </div>

          {/* Logout Button */}
          <button
            type="button"
            onClick={logout}
            className="w-full py-4 bg-white text-red-500 rounded-2xl font-semibold shadow hover:bg-red-50 transition mb-4 border border-[#f0f1fa]"
          >
            Logout
          </button>
        </div>
      </div>
      <MobileFooterNav />
    </div>
  );
};

export default Profile;
