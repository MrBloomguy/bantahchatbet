import React from 'react';
import PageHeader from '../components/PageHeader';
import TawkMessenger from '../components/TawkMessenger';
import MobileFooterNav from '../components/MobileFooterNav';

const HelpSupport: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      <PageHeader title="Help & Support" showBackButton={true} />

      <div className="flex-1 relative pb-[72px] lg:pb-0">
        <TawkMessenger />
      </div>

      <div className="lg:hidden">
        <MobileFooterNav />
      </div>
    </div>
  );
};

export default HelpSupport;