import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext'; 
import { formatNaira, formatUSD } from '../utils/currency';

const BantzzChatHeader: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { wallet } = useWallet();

  // Helper for USD conversion
  const balance = wallet?.real_balance || 0;
  const usdEquivalent = (balance / 1500).toFixed(2); // Use your actual NGN to USD rate if available

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="flex items-center h-16 px-4 w-full max-w-7xl mx-auto">
        {/* Left: Back Button and Logo */}
        <div className="flex items-center gap-3 min-w-0 flex-shrink-0">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <img src="/bantahlogo.png" alt="Bantzz" className="w-9 h-9 rounded-full shadow" />
          <span className="ml-2 text-lg font-bold text-gray-900 tracking-tight whitespace-nowrap">Bantzz Chat</span>
        </div>
        {/* Spacer to push right section to the end */}
        <div className="flex-1" />
        {/* Right: Wallet and Profile */}
        <div className="flex items-center gap-3 min-w-0 flex-shrink-0">
          <button
            type="button"
            onClick={() => navigate('/wallet')}
            className="flex items-center gap-1 px-4 py-1.5 bg-[#CCFF00] text-black font-semibold rounded-full hover:bg-[#CCFF00]/80 transition-colors shadow flex-shrink-0"
            aria-label="Wallet"
          >
            <span className="text-sm font-bold">
              {formatNaira(wallet?.real_balance || 0)}
            </span>
            <span className="text-[10px] opacity-60 ml-0.5 hidden md:inline-block">
              ({formatUSD(Number(usdEquivalent))})
            </span>
          </button>
          <button
            onClick={() => navigate('/profile')}
            className="w-9 h-9 rounded-full overflow-hidden border-2 border-gray-200 hover:border-purple-400 transition-all shadow flex-shrink-0"
            aria-label="Profile"
          >
            <img
              src={currentUser?.user_metadata?.avatar_url || '/avatar.svg'}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          </button>
        </div>
      </div>
    </header>
  );
};

export default BantzzChatHeader;
