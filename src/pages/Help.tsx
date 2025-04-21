import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import TawkMessenger from '../components/TawkMessenger';
import MobileFooterNav from '../components/MobileFooterNav';
import PageHeader from '../components/PageHeader'

const Help: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen bg-[#1a1b2e]">
     <PageHeader title="Privacy" />
        

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
