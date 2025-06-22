import React from 'react';
import Header from '../components/Header';
import SupportChatComponent from '../components/SupportChat';

const SupportChat: React.FC = () => {
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Header title="Support" showBackButton />
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full h-full max-w-2xl mx-auto">
          <SupportChatComponent />
        </div>
      </div>
    </div>
  );
};

export default SupportChat;