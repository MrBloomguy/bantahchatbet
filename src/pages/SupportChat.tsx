import React from 'react';
import Header from '../components/Header';

const TAWK_TO_URL = 'https://tawk.to/chat/652ad137eb150b3fb9a15f82/1hcnk2i67';

const SupportChat: React.FC = () => {
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Header title="Support Chat" showBackButton />
      <div className="flex-1 flex items-center justify-center">
        <iframe
          src={TAWK_TO_URL}
          className="w-full h-full border-0"
          title="Support Chat"
          allow="microphone; camera"
        />
      </div>
    </div>
  );
};

export default SupportChat;