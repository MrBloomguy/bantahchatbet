import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import EnhancedChallengeChat from '../components/EnhancedChallengeChat';
import { useChallengeChat } from '../hooks/useChallengeChat';

const ChallengeChat: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { loading } = useChallengeChat(id || '');

  if (!id) {
    return (
      <div className="flex flex-col h-screen bg-[#1A1B2E] items-center justify-center">
        <div className="text-white text-center">
          <p>Invalid challenge ID</p>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mt-4 px-4 py-2 bg-[#242538] hover:bg-[#2a2b42] rounded-lg transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col h-screen bg-white">
        {/* Skeleton Header */}
        <div className="bg-white border-b border-gray-200 p-3 flex items-center justify-between animate-pulse">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gray-300"></div>
            <div className="space-y-2">
              <div className="h-4 w-32 bg-gray-300 rounded"></div>
              <div className="h-3 w-24 bg-gray-300 rounded"></div>
            </div>
          </div>
          <div className="h-8 w-20 bg-gray-300 rounded-full"></div>
        </div>

        {/* Skeleton Messages */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50">
          {/* Skeleton message bubbles */}
          <div className="flex justify-start">
            <div className="w-8 h-8 rounded-full bg-gray-300 mr-2"></div>
            <div className="w-2/3 h-16 bg-gray-300 rounded-lg"></div>
          </div>

          <div className="flex justify-end">
            <div className="w-2/3 h-12 bg-gray-300 rounded-lg"></div>
          </div>

          <div className="flex justify-start">
            <div className="w-8 h-8 rounded-full bg-gray-300 mr-2"></div>
            <div className="w-1/2 h-20 bg-gray-300 rounded-lg"></div>
          </div>

          <div className="flex justify-end">
            <div className="w-3/4 h-14 bg-gray-300 rounded-lg"></div>
          </div>
        </div>

        {/* Skeleton Input Area */}
        <div className="bg-white border-t border-gray-200 p-3 animate-pulse">
          <div className="flex items-center">
            <div className="w-full h-10 bg-gray-300 rounded-full"></div>
            <div className="w-10 h-10 bg-gray-300 rounded-full ml-2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Enhanced Challenge Chat Component */}
      <div className="flex-1 overflow-hidden">
        <EnhancedChallengeChat challengeId={id} />
      </div>
    </div>
  );
};

export default ChallengeChat;