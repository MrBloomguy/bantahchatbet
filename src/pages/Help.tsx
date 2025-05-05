import React from 'react';
import SupportChat from '../components/SupportChat';
import MobileFooterNav from '../components/MobileFooterNav';

const Help: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Help & Support</h1>
        
        <div className="bg-white rounded-lg shadow-lg overflow-hidden h-[calc(100vh-200px)]">
          <SupportChat />
        </div>
      </div>

      <div className="lg:hidden">
        <MobileFooterNav />
      </div>
    </div>
  );
};

export default Help;
