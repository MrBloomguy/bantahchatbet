import React from 'react';

const ChatSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col h-full bg-white p-4 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center mb-6">
        <div className="w-10 h-10 rounded-full bg-gray-200"></div>
        <div className="ml-3">
          <div className="h-4 bg-gray-200 rounded w-32"></div>
          <div className="h-3 bg-gray-200 rounded w-24 mt-2"></div>
        </div>
      </div>

      {/* Chat messages skeleton */}
      <div className="flex-1 overflow-y-auto space-y-4">
        {/* Incoming message */}
        <div className="flex items-start">
          <div className="w-8 h-8 rounded-full bg-gray-200 mr-2"></div>
          <div className="max-w-[70%]">
            <div className="h-20 bg-gray-200 rounded-lg"></div>
            <div className="h-3 bg-gray-200 rounded w-16 mt-1"></div>
          </div>
        </div>

        {/* Outgoing message */}
        <div className="flex items-start justify-end">
          <div className="max-w-[70%]">
            <div className="h-12 bg-gray-200 rounded-lg"></div>
            <div className="h-3 bg-gray-200 rounded w-16 mt-1 ml-auto"></div>
          </div>
        </div>

        {/* Incoming message */}
        <div className="flex items-start">
          <div className="w-8 h-8 rounded-full bg-gray-200 mr-2"></div>
          <div className="max-w-[70%]">
            <div className="h-16 bg-gray-200 rounded-lg"></div>
            <div className="h-3 bg-gray-200 rounded w-16 mt-1"></div>
          </div>
        </div>

        {/* Outgoing message */}
        <div className="flex items-start justify-end">
          <div className="max-w-[70%]">
            <div className="h-24 bg-gray-200 rounded-lg"></div>
            <div className="h-3 bg-gray-200 rounded w-16 mt-1 ml-auto"></div>
          </div>
        </div>
      </div>

      {/* Input area skeleton */}
      <div className="mt-4 flex items-center">
        <div className="flex-1 h-10 bg-gray-200 rounded-full"></div>
        <div className="w-10 h-10 bg-gray-200 rounded-full ml-2"></div>
      </div>
    </div>
  );
};

export default ChatSkeleton;
