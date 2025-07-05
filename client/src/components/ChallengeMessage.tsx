import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../hooks/useChat';
import { useToast } from '../contexts/ToastContext';
import LoadingSpinner from './LoadingSpinner';

interface ChallengeMessageProps {
  message: {
    id: string;
    content: string;
    sender_id: string;
    created_at: string;
  };
  chatId: string;
}

interface Challenge {
  type: 'challenge';
  amount: number;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  expires_at: string;
}

const ChallengeMessage: React.FC<ChallengeMessageProps> = ({ message, chatId }) => {
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');
  const { currentUser } = useAuth();
  const { sendMessage } = useChat();
  const toast = useToast();

  const challenge: Challenge = JSON.parse(message.content);
  const isReceiver = message.sender_id !== currentUser?.id;
  const isPending = challenge.status === 'pending';
  const expiresAt = new Date(challenge.expires_at);

  useEffect(() => {
    const updateTimeLeft = () => {
      const now = new Date();
      const diff = expiresAt.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft('Expired');
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };

    const timer = setInterval(updateTimeLeft, 1000);
    updateTimeLeft();

    return () => clearInterval(timer);
  }, [expiresAt]);

  const handleResponse = async (accept: boolean) => {
    try {
      setLoading(true);

      // Send response message
      await sendMessage(chatId, JSON.stringify({
        type: 'challenge_response',
        challenge_id: message.id,
        accepted: accept,
        amount: challenge.amount
      }));

      toast.showSuccess(accept ? 'Challenge accepted!' : 'Challenge declined');
    } catch (error) {
      console.error('Error responding to challenge:', error);
      toast.showError('Failed to respond to challenge');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#1a1b2e] rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-medium">P2P Challenge</h3>
        <div className="flex items-center gap-2 text-white/60">
          <Clock className="w-4 h-4" />
          <span className="text-sm">{timeLeft}</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-white/60">Bet Amount (per player)</span>
        <span className="text-[#CCFF00] font-bold">
          ₦ {challenge.amount.toLocaleString()}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-white/60">Winner Takes</span>
        <span className="text-white font-bold">
          ₦ {(challenge.amount * 2).toLocaleString()}
        </span>
      </div>

      {isReceiver && isPending && timeLeft !== 'Expired' && (
        <div className="flex gap-3">
          <button
            onClick={() => handleResponse(false)}
            disabled={loading}
            className="flex-1 py-2 bg-red-500/20 text-red-500 rounded-lg font-medium hover:bg-red-500/30 transition-colors disabled:opacity-50"
          >
            {loading ? <LoadingSpinner size="sm" /> : 'Decline'}
          </button>
          <button
            onClick={() => handleResponse(true)}
            disabled={loading}
            className="flex-1 py-2 bg-[#CCFF00] text-black rounded-lg font-medium hover:bg-[#b3ff00] transition-colors disabled:opacity-50"
          >
            {loading ? <LoadingSpinner size="sm" color="#000000" /> : 'Accept'}
          </button>
        </div>
      )}

      {challenge.status === 'accepted' && (
        <div className="bg-green-500/20 text-green-500 py-2 px-4 rounded-lg text-center">
          Challenge Accepted
        </div>
      )}

      {challenge.status === 'declined' && (
        <div className="bg-red-500/20 text-red-500 py-2 px-4 rounded-lg text-center">
          Challenge Declined
        </div>
      )}

      {timeLeft === 'Expired' && challenge.status === 'pending' && (
        <div className="bg-yellow-500/20 text-yellow-500 py-2 px-4 rounded-lg text-center">
          Challenge Expired
        </div>
      )}
    </div>
  );
};

export default ChallengeMessage;