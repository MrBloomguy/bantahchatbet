import React from 'react';
import { Share2, ChevronRight, Wallet, Trophy, Users, TrendingUp, BarChart2, Star } from 'lucide-react';
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
    {
      icon: <Wallet className="w-5 h-5 text-[#CCFF00]" />,
      label: 'Total Earnings',
      value: `₦ ${wallet?.balance.toLocaleString() || '0'}`
    },
    {
      icon: <Trophy className="w-5 h-5 text-[#CCFF00]" />,
      label: 'Win Rate',
      value: '75%'
    },
    {
      icon: <Users className="w-5 h-5 text-[#CCFF00]" />,
      label: 'Groups Joined',
      value: '12'
    },
    {
      icon: <TrendingUp className="w-5 h-5 text-[#CCFF00]" />,
      label: 'Active Bets',
      value: '8'
    }
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
    <div className="min-h-screen bg-gradient-to-b from-[#F6F7FB] to-[#e9eafc] flex flex-col pb-[72px]">
      <PageHeader title="Profile" />
      <div className="flex-1 flex flex-col items-center w-full">
        <div className="w-full max-w-xl mx-auto px-2 sm:px-4 py-4">
          {/* Profile Card */}
          <div className="relative bg-white rounded-3xl px-6 pt-8 pb-6 flex flex-col items-center mb-6 border border-[#f0f1fa]">
            <div className="absolute right-6 top-6">
              <button onClick={handleShare} className="bg-[#F6F7FB] p-2 rounded-full hover:bg-[#CCFF00]/20 transition">
                <Share2 className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="relative mb-3">
              <img
                src={currentUser?.avatar_url || '/avatar.svg'}
                alt={currentUser?.name}
                className="w-28 h-28 rounded-full border-4 border-[#F6F7FB] shadow-lg object-cover bg-[#F6F7FB]"
              />
              {currentUser?.rank && (
                <div className="absolute -bottom-2 right-0">
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
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-[#CCFF00]" />
              <span className="text-[#CCFF00] text-sm font-semibold">{currentUser?.followers_count || 0}</span>
              <span className="text-gray-400 text-sm">followers</span>
            </div>
            <div className="flex gap-2 mt-3 items-center">
              <button
                onClick={() => navigate('/settings/profile')}
                className="px-4 py-1.5 rounded-full bg-[#CCFF00] text-black font-semibold text-sm shadow hover:bg-[#e6ff70] transition"
              >
                Edit Profile
              </button>
              <button
                onClick={() => navigate('/referral')}
                className="px-4 py-1.5 rounded-full bg-[#F6F7FB] text-[#7440ff] font-semibold text-sm shadow hover:bg-[#edeaff] transition"
              >
                Refer & Earn
              </button>
            </div>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="bg-white rounded-xl py-4 px-3 flex flex-col items-center border border-[#f0f1fa]"
              >
                <div className="mb-1">{stat.icon}</div>
                <div className="text-lg font-bold text-gray-900 tracking-tight">{stat.value}</div>
                <div className="text-xs text-gray-500 mt-0.5 font-medium uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
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
