import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext'; 
import { formatNaira } from '../utils/currency';

const BantzzChatHeader: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { wallet } = useWallet();

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="flex items-center justify-between h-16 px-4">
        <div className="flex items-center">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex items-center ml-3 gap-2">
            <img src="/bantahlogo.png" alt="Bantzz" className="w-8 h-8 rounded-full" />
            <div>
              <h1 className="text-base font-semibold text-gray-900">Bantzz Chat</h1>
              <span className="text-xs text-green-600">Online</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Wallet Balance */}
          <button
            onClick={() => navigate('/wallet')}
            className="flex items-center gap-1 px-3 py-1.5 bg-[#CCFF00] text-black font-semibold rounded-full hover:bg-[#CCFF00]/80 transition-colors"
          >
            <span className="text-sm font-bold">
              {formatNaira(wallet?.real_balance || 0)}
            </span>
          </button>

          {/* User Profile */}
          <button
            onClick={() => navigate('/profile')}
            className="w-8 h-8 rounded-full overflow-hidden border border-gray-200"
          >
            <img
              src={currentUser?.avatar_url || '/avatar.svg'}
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
