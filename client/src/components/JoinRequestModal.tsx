import React, { useState } from 'react';
import { X, Users, Tag, Trophy, Gamepad, Zap } from 'lucide-react';
import UserRankBadge from './UserRankBadge';

interface Creator {
  id: string;
  name: string;
  username?: string;
  avatar_url: string;
  rank?: number;
  stats?: any;
}

interface EventDetails {
  currentParticipants?: number;
  maxParticipants?: number;
  category?: string;
  display_participant_boost?: number;
  pool?: {
    entry_amount: number;
  }[];
}

interface JoinRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (message: string) => void;
  eventTitle: string;
  creator: Creator;
  eventDetails?: EventDetails;
  isLoading?: boolean;
}

const JoinRequestModal: React.FC<JoinRequestModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  eventTitle,
  creator,
  eventDetails,
  isLoading = false
}) => {
  const [message, setMessage] = useState('');
  const wagerAmount = eventDetails?.pool?.[0]?.entry_amount || 0;

  // Function to get the appropriate icon based on category
  const getCategoryIcon = (category?: string) => {
    if (!category) return <Tag size={12} />;

    const lowerCategory = category.toLowerCase();

    if (lowerCategory.includes('game') || lowerCategory.includes('gaming')) {
      return <Gamepad size={12} />;
    } else if (lowerCategory.includes('sport') || lowerCategory.includes('football') ||
               lowerCategory.includes('basketball') || lowerCategory.includes('soccer')) {
      return <Trophy size={12} />;
    } else if (lowerCategory.includes('event') || lowerCategory.includes('challenge')) {
      return <Zap size={12} />;
    }

    return <Tag size={12} />;
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(message);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div
        className="bg-white rounded-xl w-full max-w-sm bg-cover bg-center shadow-xl overflow-hidden"
        style={{ backgroundImage: 'url(/dialogue-bakcground.svg)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Request to Join</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close modal"
            title="Close"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4">
          {/* Event Info */}
          <div className="mb-4">
            <h3 className="text-gray-900 font-medium mb-2">{eventTitle}</h3>
            <div className="flex flex-wrap gap-2 text-gray-600 text-xs">
              <span className="bg-gray-100 px-2 py-1 rounded-full flex items-center gap-1">
                {getCategoryIcon(eventDetails?.category)}
                {eventDetails?.category
                  ? eventDetails.category.charAt(0).toUpperCase() + eventDetails.category.slice(1).toLowerCase()
                  : 'Unknown Category'}
              </span>
              <span className="bg-gray-100 px-2 py-1 rounded-full flex items-center gap-1">
                <Users size={12} />
                {(eventDetails?.currentParticipants || 0) + (eventDetails?.display_participant_boost || 0)}/{eventDetails?.maxParticipants || 0}
              </span>
            </div>
          </div>

          {/* Creator Info */}
          <div className="flex items-center gap-3 mb-4">
            <img
              src={creator.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${creator.id || 'user'}`}
              alt={creator.name}
              className="w-10 h-10 rounded-full object-cover"
              onError={(e) => {
                e.currentTarget.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${creator.id || 'user'}`;
              }}
            />
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-gray-900 text-sm font-medium">{creator.name}</p>
                {creator.rank !== undefined && <UserRankBadge rank={creator.rank} size="sm" />}
              </div>
              <p className="text-gray-500 text-xs">@{creator.username}</p>
            </div>
          </div>

          {/* Wager Amount */}
          <div className="bg-gray-100 rounded-lg p-3 mb-4 flex items-center justify-between">
            <span className="text-gray-600 text-sm">Wager Amount</span>
            <span className="text-[#7440ff] font-bold">
              ₦{wagerAmount.toLocaleString()}
            </span>
          </div>

          {/* Message Input */}
          <div className="mb-4">
            <textarea
              rows={2}
              className="w-full bg-white border border-gray-300 text-gray-900 text-sm px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7440ff] transition-shadow"
              placeholder="Add a message (optional)"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-[#7440ff] text-white rounded-lg hover:bg-[#6030e0] transition disabled:opacity-50"
            >
              {isLoading ? 'Sending Request...' : 'Send Request'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JoinRequestModal;
