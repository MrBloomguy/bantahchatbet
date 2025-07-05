import React from 'react';
import { useParams } from 'react-router-dom';
import ChatWindow from './ChatWindow';

const ChatLayout: React.FC = () => {
  const { chatId } = useParams<{ chatId?: string }>();

  return (
    <div className="flex h-screen">
      <div className="w-1/3 border-r border-gray-200">
        <ChatList selectedChatId={chatId} />
      </div>
      <div className="flex-1">
        {chatId ? (
          <ChatWindow />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            Select a chat to start messaging
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatLayout;
