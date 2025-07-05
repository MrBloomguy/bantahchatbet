import React from 'react';
import PageHeader from '../components/PageHeader';
import SupportChat from '../components/SupportChat';
import MobileFooterNav from '../components/MobileFooterNav';

const HelpSupport: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      <PageHeader title="Help & Support" showBackButton={true} />

      <div className="flex-1 relative pb-[72px] lg:pb-0">
        <div className="container mx-auto p-4">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden h-[calc(100vh-200px)]">
            <SupportChat />
          </div>
        </div>
      </div>

      <div className="lg:hidden">
        <MobileFooterNav />
      </div>
    </div>
  );
};

export default HelpSupport;