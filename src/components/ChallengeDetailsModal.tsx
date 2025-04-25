import React, { useState } from 'react';
import { X, Trophy, Calendar, Clock, MapPin, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '../lib/supabase';
import { useToast } from '../contexts/ToastContext';

interface Challenge {
  id: string;
  title: string;
  status: 'pending' | 'accepted' | 'declined' | 'completed' | 'expired' | 'missed';
  amount: number;
  game_type: string;
  platform: string;
  rules?: string;
  required_evidence?: string;
  challenger_id: string;
  challenged_id: string;
  winner_id?: string;
  expires_at: string;
  created_at: string;
  scheduled_at?: string;
  challenger: {
    name: string;
    avatar_url: string;
  };
  challenged: {
    name: string;
    avatar_url: string;
  };
}

interface ChallengeDetailsModalProps {
  challenge: Challenge;
  onClose: () => void;
}

const ChallengeDetailsModal: React.FC<ChallengeDetailsModalProps> = ({
  challenge,
  onClose
}) => {
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) return 'Not scheduled';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeUntil = (dateString: string | undefined | null) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const now = new Date();
      if (date < now) {
        return `${formatDistanceToNow(date)} ago`;
      }
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (e) {
      return '';
    }
  };

  const isDatePast = (dateString: string | undefined | null) => {
    if (!dateString) return false;
    try {
      const date = new Date(dateString);
      const now = new Date();
      return date < now;
    } catch (e) {
      return false;
    }
  };

  const handleMarkAsMissed = async () => {
    try {
      setLoading(true);

      // First try to update the status to 'missed'
      const { error } = await supabase
        .from('challenges')
        .update({ status: 'missed' })
        .eq('id', challenge.id);

      if (error) {
        console.error('Error marking challenge as missed:', error);

        // If we get a constraint error, it might be because 'missed' is not in the allowed status values
        if (error.code === '23514' && error.message?.includes('check constraint')) {
          // Try updating to 'expired' instead, which is a valid status
          const { error: expiredError } = await supabase
            .from('challenges')
            .update({ status: 'expired' })
            .eq('id', challenge.id);

          if (expiredError) {
            console.error('Error marking challenge as expired:', expiredError);
            toast.showError('Failed to mark challenge as missed or expired');
            return;
          }

          toast.showSuccess('Challenge marked as expired');
          onClose();
          return;
        }

        toast.showError('Failed to mark challenge as missed');
        return;
      }

      toast.showSuccess('Challenge marked as missed');
      onClose();
    } catch (error) {
      console.error('Error marking challenge as missed:', error);
      toast.showError('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-sm shadow-xl overflow-hidden bg-cover bg-center" style={{ backgroundImage: 'url(/dialogue-bakcground.svg)' }}>
        {/* Header */}
        <div className="p-2 border-b flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-purple-600" />
            <h2 className="text-base font-semibold text-gray-900">
              {isDatePast(challenge.scheduled_at) && challenge.status === 'pending'
                ? <span className="flex items-center">
                    Challenge
                    <span className="ml-1.5 text-[10px] px-1 py-0.5 bg-red-100 text-red-600 rounded-full">Past Due</span>
                  </span>
                : "Challenge"
              }
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="Close details"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-3">
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            {challenge.title || 'Untitled Challenge'}
          </h3>

          {/* Participants */}
          <div className="flex items-center justify-between mb-3 bg-gray-50 p-2 rounded-lg">
            <div className="flex flex-col items-center">
              <img
                src={challenge.challenger.avatar_url || '/default-avatar.png'}
                alt={challenge.challenger.name}
                className="w-10 h-10 rounded-full mb-1"
              />
              <span className="text-xs font-medium text-gray-900">{challenge.challenger.name}</span>
              <span className="text-[10px] text-purple-600 font-medium">Challenger</span>
            </div>

            <div className="flex flex-col items-center">
              <div className="text-xl font-bold text-gray-400">VS</div>
              <div className="text-xs text-gray-500 mt-0.5">₦{challenge.amount.toLocaleString()}</div>
            </div>

            <div className="flex flex-col items-center">
              <img
                src={challenge.challenged.avatar_url || '/default-avatar.png'}
                alt={challenge.challenged.name}
                className="w-10 h-10 rounded-full mb-1"
              />
              <span className="text-xs font-medium text-gray-900">{challenge.challenged.name}</span>
              <span className="text-[10px] text-blue-600 font-medium">Challenged</span>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-2 mb-3">
            <div className="flex items-start gap-2">
              <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-medium text-gray-900">Scheduled Date</div>
                <div className={`text-xs ${isDatePast(challenge.scheduled_at) ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                  {formatDate(challenge.scheduled_at)}
                  {challenge.scheduled_at && (
                    <span className={`ml-1 ${isDatePast(challenge.scheduled_at) ? 'text-red-500 font-medium' : 'text-purple-600'}`}>
                      ({getTimeUntil(challenge.scheduled_at)})
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Clock className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-medium text-gray-900">Expiration</div>
                <div className="text-xs text-gray-600">
                  {formatDate(challenge.expires_at)}
                  {challenge.expires_at && (
                    <span className="ml-1 text-red-500">({getTimeUntil(challenge.expires_at)})</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-medium text-gray-900">Game Details</div>
                <div className="text-xs text-gray-600">
                  {challenge.game_type} • {challenge.platform}
                </div>
              </div>
            </div>

            {challenge.rules && (
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-medium text-gray-900">Rules</div>
                  <div className="text-xs text-gray-600">{challenge.rules}</div>
                </div>
              </div>
            )}
          </div>

          {/* Status */}
          {challenge.status === 'missed' || (challenge.status === 'expired' && isDatePast(challenge.scheduled_at)) ? (
            <div className="bg-orange-50 p-2 rounded-lg mb-3">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                <span className="text-xs font-medium text-orange-700">
                  Challenge past due - funds refunded
                </span>
              </div>
            </div>
          ) : isDatePast(challenge.scheduled_at) && challenge.status === 'pending' ? (
            <div className="bg-red-50 p-2 rounded-lg mb-3">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                <span className="text-xs font-medium text-red-700">
                  Past due - needs to be marked as expired
                </span>
              </div>
            </div>
          ) : challenge.status === 'pending' ? (
            <div className="bg-yellow-50 p-2 rounded-lg mb-3">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></div>
                <span className="text-xs font-medium text-yellow-700">
                  Waiting to start - chat available when challenge begins
                </span>
              </div>
            </div>
          ) : null}

          {/* Actions */}
          <div className="flex justify-between">
            {isDatePast(challenge.scheduled_at) && challenge.status === 'pending' && (
              <button
                type="button"
                onClick={handleMarkAsMissed}
                disabled={loading}
                className="px-3 py-1.5 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors text-xs font-medium disabled:opacity-50 flex items-center"
              >
                {loading ? 'Processing...' : (
                  <>
                    <Clock className="w-3 h-3 mr-1" />
                    Mark as Past Due
                  </>
                )}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-xs font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChallengeDetailsModal;
