import React from 'react';
import { ChevronRight, Wallet, Trophy, Users, TrendingUp, BarChart2, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import MobileFooterNav from '../components/MobileFooterNav';
import UserRankBadge from '../components/UserRankBadge';
import PageHeader from '../components/PageHeader';
import UserLevelBadge from '../components/UserLevelBadge';

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
          <div className="relative bg-white rounded-3xl px-6 pt-8 pb-6 flex flex-col items-center mb-6 border border-[#f0f1fa]">
            {/* Refer badge at the top right - replaces share icon */}
            <div className="absolute right-6 top-6">
              <button
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
                type="button"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 17l4 4 4-4m0-5V3a1 1 0 00-1-1h-6a1 1 0 00-1 1v9m0 0l4 4 4-4" />
                </svg>
                <span>{currentUser?.referral_code ? currentUser.referral_code.slice(0, 8) : 'Refer'}</span>
              </button>
            </div>
            <div className="relative mb-3">
              <img
                src={currentUser?.avatar_url || '/avatar.svg'}
                alt={currentUser?.name}
                className="w-28 h-28 rounded-full border-4 border-[#F6F7FB] shadow-lg object-cover bg-[#F6F7FB]"
              />
              {/* Edit icon at the edge of avatar */}
              <button
                onClick={() => navigate('/settings/profile')}
                className="absolute bottom-2 right-2 p-2 rounded-full bg-[#CCFF00] text-black shadow hover:bg-[#e6ff70] transition"
                aria-label="Edit Profile"
                title="Edit Profile"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 20h9" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 3.5a2.121 2.121 0 113 3L7 19.5 3 21l1.5-4L16.5 3.5z" />
                </svg>
              </button>
              {currentUser?.rank && (
                <div className="absolute -bottom-2 left-0">
                  <UserRankBadge rank={currentUser.rank} size="lg" />
                </div>
              )}
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1 tracking-tight">{currentUser?.name}</h2>
            <p className="text-gray-500 text-base mb-2">@{currentUser?.username}</p>
            
            {/* Level and Points Section */}
            <div className="flex items-center gap-3 mb-4">
              <UserLevelBadge points={currentUser?.points || 0} size="md" />
              <div className="flex items-center gap-1 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full">
                <Star className="w-4 h-4" />
                <span className="font-medium">{currentUser?.points || 0} Points</span>
              </div>
            </div>
            
            {currentUser?.bio && (
              <p className="text-gray-700 text-center mb-3 max-w-xs leading-relaxed">{currentUser.bio}</p>
            )}
            {/* Followers Row - compact, icon + count only */}
            <div className="flex items-center gap-1 mb-2">
              <Users className="w-5 h-5 text-[#7440ff]" />
              <span className="text-[#7440ff] text-base font-semibold">{currentUser?.followers_count || 0}</span>
            </div>
          </div>

          {/* Menu Items */}
          <div className="bg-white rounded-2xl shadow divide-y divide-gray-100 mb-10 overflow-hidden border border-[#f0f1fa]">
            {menuItems.map((item, index) => (
              <button
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
