import React from 'react';
import { ArrowLeft } from 'lucide-react';
import TelegramAuth from './TelegramAuth';
import { useNavigate } from 'react-router-dom';

interface TelegramLoginModalProps {
  onClose: () => void;
}

const TelegramLoginModal: React.FC<TelegramLoginModalProps> = ({ onClose }) => {
  const navigate = useNavigate();

  const handleSuccess = () => {
    onClose();
    navigate('/');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-white dark:bg-gray-900 rounded-xl p-5 max-w-md w-full mx-4 relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 left-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <ArrowLeft size={20} />
        </button>
        
        <div className="text-center mb-6 mt-2">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Sign in with Telegram</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Use your Telegram account to sign in securely
          </p>
        </div>
        
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="bg-[#0088cc] p-4 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="white">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-1.97 9.269c-.145.658-.537.818-1.084.51l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.121l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.538-.196 1.006.128.833.95z"/>
            </svg>
          </div>
          
          <div className="my-4">
            <TelegramAuth 
              buttonSize="large"
              cornerRadius={10}
              onSuccess={handleSuccess}
              botId="bantahchatbot"
            />
          </div>
          
          <div className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4 max-w-xs">
            By signing in with Telegram, you agree to our Terms of Service and Privacy Policy.
            We will only access your name and profile picture.
          </div>
        </div>
      </div>
    </div>
  );
};

export default TelegramLoginModal;
