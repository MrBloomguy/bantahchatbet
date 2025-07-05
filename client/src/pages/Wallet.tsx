import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowDownRight, ArrowUpRight, Trophy } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import WalletCard from '../components/WalletCard';
import EnhancedWalletHistory from '../components/EnhancedWalletHistory';
import MobileFooterNav from '../components/MobileFooterNav';
import { useToast } from '../contexts/ToastContext';
import { useWallet } from '../contexts/WalletContext';
import { SimplePaystackWidget } from '../components/SimplePaystackWidget';
import { PaystackWithdrawalWidget } from '../components/PaystackWithdrawalWidget';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatNaira } from '../utils/currency';

const Wallet: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const toast = useToast();
  const { wallet, loading, refreshWallet } = useWallet();
  const [activeTab, setActiveTab] = useState<'overview' | 'deposit' | 'withdraw' | 'history'>('overview');
  const [depositAmount, setDepositAmount] = useState<number>(0);
  const [withdrawAmount, setWithdrawAmount] = useState<number>(0);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  useEffect(() => {
    const status = searchParams.get('status');
    const reference = searchParams.get('reference');

    if (status === 'success') {
      // Refresh wallet data to show new balance
      refreshWallet();

      toast.showSuccess('Payment successful! Your wallet has been credited.');
      // Log the reference for debugging
      console.log('Payment Reference:', reference);

      // Clean up the URL
      navigate('/wallet', { replace: true });
    }
  }, [searchParams, toast, navigate, refreshWallet]);

  const handleDeposit = () => {
    if (depositAmount < 100) {
      toast.showError('Minimum deposit amount is ₦100');
      return;
    }
    setShowDepositModal(true);
  };

  const handleWithdraw = () => {
    if (withdrawAmount < 100) {
      toast.showError('Minimum withdrawal amount is ₦100');
      return;
    }

    if (!wallet || withdrawAmount > wallet.real_balance) {
      toast.showError('Insufficient balance');
      return;
    }

    setShowWithdrawModal(true);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'deposit':
        return (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-bold mb-4">Deposit Funds</h2>
            <p className="text-gray-600 mb-4">Add money to your wallet using any payment method</p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₦)</label>
              <input
                type="number"
                min="100"
                value={depositAmount || ''}
                onChange={(e) => setDepositAmount(Number(e.target.value))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter amount"
              />
            </div>

            <div className="flex gap-2 mb-4">
              {[1000, 2000, 5000, 10000].map(amount => (
                <button
                  type="button"
                  key={amount}
                  onClick={() => setDepositAmount(amount)}
                  className={`flex-1 py-2 rounded-lg border ${
                    depositAmount === amount
                      ? 'bg-purple-100 border-purple-500 text-purple-700'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  ₦{amount.toLocaleString()}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleDeposit}
              disabled={depositAmount < 100}
              className="w-full bg-purple-600 text-white py-3 rounded-xl font-medium hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Proceed to Payment
            </button>

            {showDepositModal && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-xl max-w-md w-full p-6">
                  <h3 className="text-xl font-bold mb-4">Complete Your Deposit</h3>
                  <SimplePaystackWidget
                    amount={depositAmount}
                    onSuccess={() => {
                      setShowDepositModal(false);
                      refreshWallet();
                      setActiveTab('overview');
                    }}
                    onClose={() => setShowDepositModal(false)}
                  />
                </div>
              </div>
            )}
          </div>
        );

      case 'withdraw':
        return (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-bold mb-4">Withdraw Funds</h2>
            <p className="text-gray-600 mb-4">Withdraw money from your wallet to your bank account</p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Available Balance</label>
              <div className="text-2xl font-bold text-gray-900 mb-4">
                {formatNaira(wallet?.real_balance || 0)}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₦)</label>
              <input
                type="number"
                min="100"
                max={wallet?.real_balance || 0}
                value={withdrawAmount || ''}
                onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter amount"
              />
            </div>

            <div className="flex gap-2 mb-4">
              {[1000, 2000, 5000, 10000].map(amount => (
                <button
                  key={amount}
                  onClick={() => setWithdrawAmount(amount)}
                  disabled={amount > (wallet?.real_balance || 0)}
                  className={`flex-1 py-2 rounded-lg border ${
                    withdrawAmount === amount
                      ? 'bg-purple-100 border-purple-500 text-purple-700'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  } ${amount > (wallet?.real_balance || 0) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  ₦{amount.toLocaleString()}
                </button>
              ))}
            </div>

            <button
              onClick={handleWithdraw}
              disabled={withdrawAmount < 100 || withdrawAmount > (wallet?.real_balance || 0)}
              className="w-full bg-purple-600 text-white py-3 rounded-xl font-medium hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Proceed to Withdrawal
            </button>

            {showWithdrawModal && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-xl max-w-md w-full p-6">
                  <h3 className="text-xl font-bold mb-4">Complete Your Withdrawal</h3>
                  <PaystackWithdrawalWidget
                    amount={withdrawAmount}
                    balanceType="real"
                    onSuccess={() => {
                      setShowWithdrawModal(false);
                      refreshWallet();
                      setActiveTab('overview');
                    }}
                    onClose={() => setShowWithdrawModal(false)}
                  />
                </div>
              </div>
            )}
          </div>
        );

      case 'history':
        return <EnhancedWalletHistory />;

      default:
        return (
          <div className="space-y-4">
            <WalletCard />

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setActiveTab('deposit')}
                  className="flex flex-col items-center justify-center p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-colors"
                >
                  <ArrowDownRight className="w-8 h-8 text-green-600 mb-2" />
                  <span className="text-sm font-medium text-gray-900">Deposit</span>
                </button>

                <button
                  onClick={() => setActiveTab('withdraw')}
                  className="flex flex-col items-center justify-center p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors"
                >
                  <ArrowUpRight className="w-8 h-8 text-blue-600 mb-2" />
                  <span className="text-sm font-medium text-gray-900">Withdraw</span>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Recent Transactions</h2>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab('history')}
                    className="text-sm text-purple-600 font-medium hover:text-purple-800"
                  >
                    View All
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/activity-history')}
                    className="text-sm text-purple-600 font-medium hover:text-purple-800 flex items-center gap-1"
                  >
                    <Trophy className="w-3 h-3" /> Activity History
                  </button>
                </div>
              </div>
              <EnhancedWalletHistory limit={5} showFilters={false} />
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader title="Wallet" showBackButton />

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <>
          <div className="max-w-lg mx-auto p-4 space-y-4">
            {/* Navigation Tabs */}
            <div className="bg-white rounded-xl p-1 flex shadow-sm">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                  activeTab === 'overview'
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                Overview
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('deposit')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                  activeTab === 'deposit'
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                Deposit
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('withdraw')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                  activeTab === 'withdraw'
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                Withdraw
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                  activeTab === 'history'
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                History
              </button>
            </div>

            {renderTabContent()}
          </div>
        </>
      )}

      <MobileFooterNav />
    </div>
  );
};

export default Wallet;
