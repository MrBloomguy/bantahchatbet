import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import EnhancedChallengeChat from '../components/EnhancedChallengeChat';
import LoadingSpinner from '../components/LoadingSpinner';
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

  if (loading) return <LoadingSpinner />;

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