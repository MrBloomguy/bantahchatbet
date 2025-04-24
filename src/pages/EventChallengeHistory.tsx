import React, { useState } from 'react';
import { Swords, Trophy, Filter } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import EnhancedWalletHistory from '../components/EnhancedWalletHistory';
import MobileFooterNav from '../components/MobileFooterNav';

const EventChallengeHistory: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'events' | 'challenges'>('all');

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader title="Activity History" showBackButton />

      <div className="max-w-lg mx-auto p-4 space-y-4">
        {/* Filter Tabs */}
        <div className="bg-white rounded-xl p-1 flex shadow-sm">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium ${
              activeTab === 'all'
                ? 'bg-purple-100 text-purple-700'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            All Activity
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('events')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1 ${
              activeTab === 'events'
                ? 'bg-purple-100 text-purple-700'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Trophy className="w-4 h-4" />
            Events
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('challenges')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1 ${
              activeTab === 'challenges'
                ? 'bg-purple-100 text-purple-700'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Swords className="w-4 h-4" />
            Challenges
          </button>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'all' && (
          <EnhancedWalletHistory showFilters={false} />
        )}

        {activeTab === 'events' && (
          <EnhancedWalletHistory filter="events" showFilters={false} />
        )}

        {activeTab === 'challenges' && (
          <EnhancedWalletHistory filter="challenges" showFilters={false} />
        )}
      </div>

      <MobileFooterNav />
    </div>
  );
};

export default EventChallengeHistory;
