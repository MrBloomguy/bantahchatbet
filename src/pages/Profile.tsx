import React from 'react';
import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

import MobileFooterNav from '../components/MobileFooterNav';
import UserRankBadge from '../components/UserRankBadge';
import PageHeader from '../components/PageHeader';
import UserLevelBadge from '../components/UserLevelBadge';

const Profile: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

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
      path: '/privacy'
    },
    {
      label: 'Help & Support',
      path: '/help'
    }
  ];



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
                <div className="flex justify-center">
                  <div className="relative">
                    <img
                      src={currentUser?.avatar_url || '/avatar.svg'}
                      alt={currentUser?.name || 'User'}
                      className="w-32 h-32 rounded-full object-cover"
                    />

                    {/* Edit profile button - positioned directly on the edge of the avatar */}
                    <button
                      type="button"
                      onClick={() => navigate('/settings/profile')}
                      className="absolute bottom-1 right-1 p-2 rounded-full bg-[#CCFF00] text-black shadow hover:bg-[#e6ff70] transition"
                      aria-label="Edit Profile"
                      title="Edit Profile"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 3.5a2.121 2.121 0 113 3L7 19.5 3 21l1.5-4L16.5 3.5z" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Rank badge - smaller size */}
                {currentUser?.rank && (
                  <div className="absolute -bottom-1 left-4">
                    <UserRankBadge rank={currentUser.rank} size="md" />
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
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                    </svg>
                    <span className="font-medium">{currentUser?.points || 0}</span>
                  </div>
                  <span className="text-xs text-gray-500 mt-1">Points</span>
                </div>

                {/* Followers */}
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                      <path d="M9 10a3 3 0 1 0 6 0a3 3 0 0 0-6 0zm-3 8V19c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2v-1c0-1.1-.9-2-2-2h-2c-1.1 0-2-.9-2-2s-.9-2-2-2c-1.1 0-2 .9-2 2H6c-1.1 0-2 .9-2 2v1zm10-8a3 3 0 1 0 6 0a3 3 0 0 0-6 0zM13 18v1c0 1.1.9 2 2 2h4c1.1 0 2-.9 2-2v-1c0-1.1-.9-2-2-2h-2c-1.1 0-2 .9-2 2s-.9 2-2 2H8c-1.1 0-2-.9-2-2v-1c0-1.1.9-2 2-2h2c1.1 0 2 .9 2 2s.9 2 2 2h2z" />
                    </svg>
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