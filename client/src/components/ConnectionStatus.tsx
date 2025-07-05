import React from 'react';

interface ConnectionStatusProps {
  status: 'connecting' | 'connected' | 'disconnected';
}

const statusMap = {
  connecting: { color: 'bg-yellow-400', text: 'Connecting...' },
  connected: { color: 'bg-green-500', text: 'Connected' },
  disconnected: { color: 'bg-red-500', text: 'Disconnected. Reconnecting...' },
};

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ status }) => {
  const { color, text } = statusMap[status] || statusMap.connecting;
  return (
    <div className={`flex items-center gap-2 text-xs px-2 py-1 rounded ${color} text-white font-medium transition-colors duration-300`}>
      <span className={`inline-block w-2 h-2 rounded-full ${color} mr-1`} />
      {text}
    </div>
  );
};
