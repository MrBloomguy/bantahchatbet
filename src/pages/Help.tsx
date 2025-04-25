import React from 'react';
import TawkMessenger from '../components/TawkMessenger';
import MobileFooterNav from '../components/MobileFooterNav';
import PageHeader from '../components/PageHeader';

const Help: React.FC = () => {

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <PageHeader title="Help & Support" />

      <div className="flex-1 relative pb-[72px] lg:pb-0">
        <TawkMessenger />
      </div>

      <div className="lg:hidden">
        <MobileFooterNav />
      </div>
    </div>
  );
};

export default Help;
