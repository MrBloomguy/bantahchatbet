import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface TelegramLoginModalProps {
  onClose: () => void;
}

// Define the onTelegramAuth function on the window object
declare global {
  interface Window {
    onTelegramAuth: (user: any) => void;
  }
}

window.onTelegramAuth = function(user) {
  fetch('/api/telegram-auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        window.location.href = '/';
      } else {
        alert('Authentication failed.');
      }
    })
    .catch((error) => {
      console.error('Error during authentication:', error);
      alert('An error occurred. Please try again.');
    });
};

const TelegramLoginModal: React.FC<TelegramLoginModalProps> = ({ onClose }) => {
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
          <script
            async
            src="https://telegram.org/js/telegram-widget.js?22"
            data-telegram-login="bantahchatbot"
            data-size="large"
            data-onauth="onTelegramAuth"
            data-request-access="write"
          ></script>
        </div>
      </div>
    </div>
  );
};

export default TelegramLoginModal;
