import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../hooks/useNotification';
import { useWallet } from '../contexts/WalletContext';
import { formatNaira, formatUSD, convertNGNtoUSD } from '../utils/currency';
import {
  Bell,
  MessageSquare,
  Wallet,
  LogIn,
  Search,
  ArrowLeft
} from 'lucide-react';
const HeaderActions = () => {
  const navigate = useNavigate();
  const { unreadCount } = useNotification();
  const { wallet } = useWallet();

  const balance = wallet?.real_balance || 0;
  const usdEquivalent = convertNGNtoUSD(balance);
  const formatNumber = (num, currency) => {
    if (num >= 1_000_000) return currency + (num / 1_000_000).toFixed(2).replace(/\.00$/, '') + 'M';
    if (num >= 1_000) return currency + (num / 1_000).toFixed(2).replace(/\.00$/, '') + 'K';
    return currency + num.toFixed(2).replace(/\.00$/, '');
  };

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">

        <button
          onClick={() => navigate('/leaderboard')}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <img src="/leaderboard_icon.png" alt="Leaderboard" className="w-5 h-5" />
        </button>

        <button
          onClick={() => navigate('/messages')}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <img src="/mes.svg" alt="Messages" className="w-6 h-6" />
        </button>

        <button
          onClick={() => navigate('/notifications')}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors relative"
        >
          <img src="/notify22.svg" alt="Notifications" className="w-6 h-6" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {wallet ? (
        <button
          onClick={() => handleNavigate('/wallet')}
          className="flex items-center gap-1 px-3 py-1.5 bg-[#CCFF00] text-black font-semibold rounded-full hover:bg-[#CCFF00]/80 transition-colors"
          aria-label="Wallet"
        >
          <span className="text-sm font-bold">
            {formatNumber(balance, '₦')}
            <span className="text-[10px] opacity-60 ml-0.5">
              ({formatNumber(parseFloat(usdEquivalent), '$')})
            </span>
          </span>
        </button>
      ) : (
        <button
          onClick={() => handleNavigate('/signin')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
        >
          {/* Assuming you are importing a LogIn component, e.g., from react-feather */}
          <LogIn className="h-4 w-4" />
          <span>Login</span>
        </button>
      )}
    </div>
  );
};

export default HeaderActions;