import React, { useState } from 'react';
import PageHeader from '../components/PageHeader';
import SimpleProfileCard from '../components/SimpleProfileCard';
import { useAuth } from '../contexts/AuthContext';
import MobileFooterNav from '../components/MobileFooterNav';
import UserAvatar from '../components/UserAvatar';

const SimpleProfileCardDemo: React.FC = () => {
  const { currentUser } = useAuth();
  const [showProfileCard, setShowProfileCard] = useState(false);

  // Sample profile data based on current user
  const sampleUser = currentUser ? {
    id: currentUser.id,
    name: currentUser.name || 'User Name',
    username: currentUser.username || 'username',
    avatar_url: currentUser.avatar_url || '/avatar.svg',
    bio: currentUser.bio || 'This is a sample bio for the profile card demonstration.',
    points: currentUser.points || 1000,
    followers_count: 250,
    stats: {
      events_won: 10,
      total_earnings: 500
    }
  } : {
    id: '123',
    name: 'Demo User',
    username: 'demouser',
    avatar_url: '/avatar.svg',
    bio: 'This is a sample bio for the profile card demonstration.',
    points: 1000,
    followers_count: 250,
    stats: {
      events_won: 10,
      total_earnings: 500
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F7FB] flex flex-col pb-[70px]">
      <PageHeader title="Profile Card Demo" showBackButton />
      
      <div className="flex-1 flex flex-col items-center w-full">
        <div className="w-full max-w-xl mx-auto px-4 py-6">
          <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Profile Card Pop-up Demo</h2>
            <p className="text-gray-600 mb-6">
              Click on the avatar below to see the profile card pop-up. This demonstrates how the profile card appears when users interact with avatars throughout the application.
            </p>
            
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => setShowProfileCard(true)}
                className="relative inline-block"
              >
                <UserAvatar
                  src={currentUser?.avatar_url || '/avatar.svg'}
                  alt={currentUser?.name || 'User'}
                  size="xl"
                  className="w-20 h-20 border-2 border-purple-100 hover:border-purple-300 transition-all duration-200"
                  points={currentUser?.points || 0}
                  showLevelBadge={true}
                />
                <span className="block mt-2 text-sm text-center text-purple-600 font-medium">
                  Click to view profile card
                </span>
              </button>
            </div>
          </div>
          
          {/* Usage examples */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Usage Examples</h2>
            <p className="text-gray-600 mb-4">
              The profile card pop-up is used in various places throughout the application:
            </p>
            
            <ul className="list-disc pl-5 space-y-2 text-gray-700">
              <li>When hovering over a user's avatar in chat messages</li>
              <li>When clicking on a participant in an event</li>
              <li>When viewing search results for users</li>
              <li>When hovering over @username mentions in comments</li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* Profile Card Modal */}
      {showProfileCard && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <SimpleProfileCard
            user={sampleUser}
            onClose={() => setShowProfileCard(false)}
          />
        </div>
      )}
      
      <MobileFooterNav />
    </div>
  );
};

export default SimpleProfileCardDemo;
