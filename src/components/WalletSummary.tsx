import React from 'react';
import { Plus, ArrowUpRight, Eye, EyeOff } from 'lucide-react';
import { formatNaira } from '../utils/currency';

interface WalletSummaryProps {
  realBalance: number;
  bonusBalance: number;
  onDeposit: () => void;
  onWithdraw: () => void;
  isLoading?: boolean;
}

const WalletSummary: React.FC<WalletSummaryProps> = ({
  realBalance,
  bonusBalance,
  onDeposit,
  onWithdraw,
  isLoading = false,
}) => {
  const [showBalance, setShowBalance] = React.useState(true);

  return (
    <div className="bg-gradient-to-br from-[#7440FF] to-[#6030FF] rounded-2xl p-6 text-white shadow-xl shadow-[#7440FF]/25 transition-all duration-300">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-sm font-medium text-white/80">Total Balance</h2>
          <div className="flex items-center gap-2 mt-1">
            <div className={`text-2xl font-bold transition-all duration-300 ${isLoading ? 'opacity-50' : ''}`}>
              {isLoading ? (
                <div className="h-8 w-32 bg-white/20 rounded-lg animate-pulse" />
              ) : (
                showBalance ? formatNaira(realBalance + bonusBalance) : '•••••••'
              )}
            </div>
            <button
              onClick={() => setShowBalance(!showBalance)}
              className="p-1 hover:bg-white/10 rounded-lg transition-colors"
              disabled={isLoading}
            >
              {showBalance ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={onDeposit}
            disabled={isLoading}
            className={`flex items-center gap-2 px-4 py-2 bg-white text-[#7440FF] rounded-xl font-medium transition-all duration-200
              ${isLoading 
                ? 'opacity-50 cursor-not-allowed' 
                : 'hover:bg-white/90 hover:shadow-lg hover:-translate-y-0.5'}`}
          >
            <Plus size={18} />
            Deposit
          </button>
          <button
            onClick={onWithdraw}
            disabled={isLoading}
            className={`flex items-center gap-2 px-4 py-2 bg-white/10 rounded-xl font-medium transition-all duration-200
              ${isLoading 
                ? 'opacity-50 cursor-not-allowed' 
                : 'hover:bg-white/20 hover:shadow-lg hover:-translate-y-0.5'}`}
          >
            <ArrowUpRight size={18} />
            Withdraw
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className={`p-4 rounded-xl bg-white/10 transition-all duration-200 ${
          !isLoading && 'hover:bg-white/20'
        }`}>
          <div className="text-sm font-medium text-white/80">Real Balance</div>
          {isLoading ? (
            <div className="h-6 w-24 bg-white/20 rounded-lg animate-pulse mt-1" />
          ) : (
            <div className="text-lg font-bold mt-1">
              {showBalance ? formatNaira(realBalance) : '•••••••'}
            </div>
          )}
        </div>
        <div className={`p-4 rounded-xl bg-white/10 transition-all duration-200 ${
          !isLoading && 'hover:bg-white/20'
        }`}>
          <div className="text-sm font-medium text-white/80">Bonus Balance</div>
          {isLoading ? (
            <div className="h-6 w-24 bg-white/20 rounded-lg animate-pulse mt-1" />
          ) : (
            <div className="text-lg font-bold mt-1">
              {showBalance ? formatNaira(bonusBalance) : '•••••••'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WalletSummary;