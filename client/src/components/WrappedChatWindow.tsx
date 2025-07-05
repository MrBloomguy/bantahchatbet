import React from 'react';
import ChatWindow from './ChatWindow';

const WrappedChatWindow: React.FC = () => {
  const handleNewMessage = () => {
    // Handle new message event
  };

  return (
    <ChatWindow onNewMessageSent={handleNewMessage} />
  );
};

export default WrappedChatWindow;