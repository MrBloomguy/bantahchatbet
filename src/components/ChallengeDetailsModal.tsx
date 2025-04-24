import React from 'react';
import { X, Trophy, Calendar, Clock, MapPin, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Challenge {
  id: string;
  title: string;
  status: string;
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
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (e) {
      return '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-900">Scheduled Challenge</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="Close details"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            {challenge.title || 'Untitled Challenge'}
          </h3>

          {/* Participants */}
          <div className="flex items-center justify-between mb-6 bg-gray-50 p-3 rounded-xl">
            <div className="flex flex-col items-center">
              <img
                src={challenge.challenger.avatar_url || '/default-avatar.png'}
                alt={challenge.challenger.name}
                className="w-12 h-12 rounded-full mb-2"
              />
              <span className="text-sm font-medium text-gray-900">{challenge.challenger.name}</span>
              <span className="text-xs text-purple-600 font-medium">Challenger</span>
            </div>

            <div className="flex flex-col items-center">
              <div className="text-2xl font-bold text-gray-400">VS</div>
              <div className="text-sm text-gray-500 mt-1">₦{challenge.amount.toLocaleString()}</div>
            </div>

            <div className="flex flex-col items-center">
              <img
                src={challenge.challenged.avatar_url || '/default-avatar.png'}
                alt={challenge.challenged.name}
                className="w-12 h-12 rounded-full mb-2"
              />
              <span className="text-sm font-medium text-gray-900">{challenge.challenged.name}</span>
              <span className="text-xs text-blue-600 font-medium">Challenged</span>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-4 mb-6">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-gray-900">Scheduled Date</div>
                <div className="text-sm text-gray-600">{formatDate(challenge.scheduled_at)}</div>
                {challenge.scheduled_at && (
                  <div className="text-xs text-purple-600 mt-1">{getTimeUntil(challenge.scheduled_at)}</div>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-gray-900">Expiration</div>
                <div className="text-sm text-gray-600">{formatDate(challenge.expires_at)}</div>
                {challenge.expires_at && (
                  <div className="text-xs text-red-500 mt-1">{getTimeUntil(challenge.expires_at)}</div>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-gray-900">Game Details</div>
                <div className="text-sm text-gray-600">
                  {challenge.game_type} • {challenge.platform}
                </div>
              </div>
            </div>

            {challenge.rules && (
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-gray-900">Rules</div>
                  <div className="text-sm text-gray-600">{challenge.rules}</div>
                </div>
              </div>
            )}
          </div>

          {/* Status */}
          <div className="bg-yellow-50 p-3 rounded-lg mb-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-sm font-medium text-yellow-700">
                This challenge is scheduled and waiting to start
              </span>
            </div>
            <p className="text-xs text-yellow-600 mt-1 ml-4">
              You'll be notified when it's time to play. The chat will be available once the challenge starts.
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
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
