import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import '../styles/dialogue-background.css';
import {
  ArrowDownRight,
  ArrowUpRight,
  CreditCard,
  Filter,
  Trophy,
  X,
  ChevronRight,
  Clock,
  DollarSign
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import EnhancedWalletHistory from '../components/EnhancedWalletHistory';
import MobileFooterNav from '../components/MobileFooterNav';
import { useToast } from '../contexts/ToastContext';
import { useWallet } from '../contexts/WalletContext';
import { SimplePaystackWidget } from '../components/SimplePaystackWidget';
import { CompactWithdrawalWidget } from '../components/CompactWithdrawalWidget';
import TransferFormModal from '../components/TransferFormModal';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatNaira, formatUSD, convertNGNtoUSD } from '../utils/currency';

type TransactionType = 'deposit' | 'withdrawal' | 'transfer';
type BalanceType = 'real' | 'bonus';

const WalletRedesigned: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const toast = useToast();
  const { wallet, loading, refreshWallet } = useWallet();
  const [activeTab, setActiveTab] = useState<'overview' | 'deposit' | 'withdraw' | 'history'>('overview');
  const [amount, setAmount] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transactionType, setTransactionType] = useState<TransactionType>('deposit');
  const [balanceType, setBalanceType] = useState<BalanceType>('real');

  const balance = wallet?.real_balance || 0;
  const bonusBalance = wallet?.bonus_balance || 0;
  const usdEquivalent = convertNGNtoUSD(balance);

  useEffect(() => {
    const status = searchParams.get('status');
    const reference = searchParams.get('reference');

    if (status === 'success') {
      // Refresh wallet data to show new balance
      refreshWallet();
      toast.showSuccess('Payment successful! Your wallet has been credited.');
      // Clean up the URL
      navigate('/wallet', { replace: true });
    }
  }, [searchParams, toast, navigate, refreshWallet]);

  const handleActionClick = (type: TransactionType) => {
    setTransactionType(type);
    setAmount('');
    setShowPaymentModal(true);
  };

  const ActionButton = ({ icon: Icon, label, color, onClick, bgColor }: any) => (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-4 ${bgColor} rounded-xl hover:opacity-90 transition-all duration-200 w-full`}
    >
      <div className={`p-3 ${color} rounded-full mb-2`}>
        <Icon className="w-6 h-6" />
      </div>
      <span className="text-sm font-medium text-gray-900">{label}</span>
    </button>
  );

  const QuickAmountButton = ({ amount, onClick, isSelected }: any) => (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        isSelected
          ? 'bg-purple-100 border border-purple-300 text-purple-700'
          : 'bg-gray-100 border border-gray-200 text-gray-700 hover:bg-gray-200'
      }`}
    >
      ₦{amount.toLocaleString()}
    </button>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F6F7FB] flex flex-col">
        <PageHeader title="Wallet" showBackButton />
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
        <MobileFooterNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F7FB] flex flex-col pb-[70px]">
      <PageHeader title="Wallet" showBackButton />

      <div className="flex-1 flex flex-col items-center w-full">
        <div className="w-full max-w-lg mx-auto px-2 sm:px-4 py-4">
          {/* Modern Wallet Card */}
          <div className="bg-gradient-to-br from-[#f8f8ff] to-[#f3f3fa] rounded-2xl p-5 mb-5 border border-[#ececf6] shadow-sm flex flex-col gap-4">
            {/* Balance Display */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-xs text-gray-500 mb-1">Total Balance</div>
                <div className="flex items-baseline gap-2">
                  <div className="text-2xl font-bold text-gray-900 leading-tight">{formatNaira(balance)}</div>
                  <div className="text-xs text-gray-400">{formatUSD(usdEquivalent)} USD</div>
                </div>
              </div>
              <div className="flex flex-col gap-1 text-right">
                <div className="text-[11px] text-gray-400">Real</div>
                <div className="text-sm font-semibold text-gray-800">{formatNaira(balance)}</div>
                <div className="text-[11px] text-gray-400 mt-1">Bonus</div>
                <div className="text-sm font-semibold text-gray-800">{formatNaira(bonusBalance)}</div>
              </div>
            </div>
            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-2 mt-2">
              <ActionButton
                icon={ArrowDownRight}
                label="Deposit"
                color="bg-green-100 text-green-600"
                bgColor="bg-green-50"
                onClick={() => handleActionClick('deposit')}
              />
              <ActionButton
                icon={ArrowUpRight}
                label="Withdraw"
                color="bg-purple-100 text-purple-600"
                bgColor="bg-purple-50"
                onClick={() => handleActionClick('withdrawal')}
              />
            </div>
          </div>

          {/* Recent Transactions - Compact Modern Card */}
          <div className="bg-white rounded-xl p-4 mb-5 border border-[#ececf6] shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold text-gray-900">Recent Transactions</h3>
              <button
                type="button"
                onClick={() => navigate('/activity-history')}
                className="text-xs text-[#7440FF] font-medium flex items-center gap-1 hover:underline"
              >
                View All <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <EnhancedWalletHistory limit={5} showFilters={false} />
          </div>

          {/* Payment/Withdrawal Modal - Modernized */}
          {showPaymentModal && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-xl max-w-xs w-full p-4 relative border border-[#ececf6] shadow-xl">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="absolute right-3 top-3 p-1 rounded-full hover:bg-gray-100 transition-colors"
                  aria-label="Close modal"
                  title="Close"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
                <div className="space-y-3">
                  <div>
                    <h3 className="text-base font-bold text-gray-900">
                      {transactionType === 'deposit' ? 'Add Funds' : 'Withdraw'}
                    </h3>
                    <p className="text-xs text-gray-500">Enter amount below</p>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">₦</span>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 text-gray-900 px-7 py-2 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-transparent"
                      placeholder="0.00"
                      min="100"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    {[1000, 2000, 5000, 10000, 20000, 50000].map((quickAmount) => (
                      <button
                        type="button"
                        key={quickAmount}
                        onClick={() => setAmount(quickAmount.toString())}
                        className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                          Number(amount) === quickAmount
                            ? 'bg-purple-100 border border-purple-300 text-purple-700'
                            : 'bg-gray-100 border border-gray-200 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        ₦{quickAmount.toLocaleString()}
                      </button>
                    ))}
                  </div>
                  <div>
                    {transactionType === 'deposit' ? (
                      <SimplePaystackWidget
                        amount={Number(amount)}
                        onSuccess={() => {
                          setShowPaymentModal(false);
                          setAmount('');
                        }}
                        onClose={() => setShowPaymentModal(false)}
                      />
                    ) : (
                      <CompactWithdrawalWidget
                        amount={Number(amount)}
                        balanceType={balanceType}
                        onSuccess={() => {
                          setShowPaymentModal(false);
                          setAmount('');
                        }}
                        onClose={() => setShowPaymentModal(false)}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Transfer Modal - Hidden but kept for use in ProfileCard */}
          {false && (
            <TransferFormModal
              onClose={() => setShowTransferModal(false)}
              onSuccess={() => {
                setShowTransferModal(false);
                setAmount('');
              }}
            />
          )}
        </div>
      </div>

      <MobileFooterNav />
    </div>
  );
};

export default WalletRedesigned;
