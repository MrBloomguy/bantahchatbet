import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ChatHeaderProps {
  title?: string;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ title = 'Chat' }) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  return (
    <header className="flex items-center justify-between px-4 h-16 border-b border-gray-100">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Go back"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Wallet Button */}
        <button
          className="px-3 py-1.5 text-sm font-medium text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
        >
          100 BNB
        </button>

        {/* User Profile Button */}
        <button className="flex items-center justify-center w-8 h-8 rounded-full overflow-hidden border border-gray-200">
          <img
            src={currentUser?.avatar_url || '/avatar.svg'}
            alt="Profile"
            className="w-full h-full object-cover"
          />
        </button>
      </div>
    </header>
  );
};

export default ChatHeader;
