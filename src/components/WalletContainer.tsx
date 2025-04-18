import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import WalletSummary from './WalletSummary';
import WalletTransactionHistory from './WalletTransactionHistory';
import { useWallet } from '../hooks/useWallet';

const WalletContainer: React.FC = () => {
  const { wallet, loading } = useWallet();
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  const handleDeposit = () => {
    setShowDepositModal(true);
  };

  const handleWithdraw = () => {
    setShowWithdrawModal(true);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <WalletSummary
        realBalance={wallet?.real_balance || 0}
        bonusBalance={wallet?.bonus_balance || 0}
        onDeposit={handleDeposit}
        onWithdraw={handleWithdraw}
      />
      
      <WalletTransactionHistory />
      
      {/* Deposit and Withdraw modals can be added here */}
    </div>
  );
};

export default WalletContainer;