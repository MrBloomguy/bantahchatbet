import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../hooks/useNotification';
import { useWallet } from '../contexts/WalletContext';
import { convertNGNtoUSD } from '../utils/currency';

const HeaderActions = () => {
  const navigate = useNavigate();
  const { unreadCount } = useNotification();
  const { wallet } = useWallet();
  
  const balance = wallet?.real_balance || 0;
  const usdEquivalent = convertNGNtoUSD(balance);

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate('/messages')}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <img src="/messages-brutal.svg" alt="Messages" className="w-6 h-6" />
        </button>
        
        <button
          onClick={() => navigate('/leaderboard')}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <img src="/leaderboard_icon.png" alt="Leaderboard" className="w-5 h-5" />
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

      <button
        onClick={() => navigate('/wallet')}
        className="flex items-center gap-1 px-3 py-1.5 bg-[#CCFF00] text-black font-semibold rounded-full hover:bg-[#CCFF00]/80 transition-colors"
      >
        <span className="text-sm whitespace-nowrap">
          ₦{Math.floor(balance).toLocaleString()}
          <span className="text-black/60 text-xs ml-1">
            (${Number(usdEquivalent).toFixed(2)})
          </span>
        </span>
      </button>
    </div>
  );
};

export default HeaderActions;
