import React, { useState } from 'react';
import { X, Users } from 'lucide-react';
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
}

const JoinRequestModal: React.FC<JoinRequestModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  eventTitle,
  creator,
  eventDetails
}) => {
  const [message, setMessage] = useState('');
  const wagerAmount = eventDetails?.pool?.[0]?.entry_amount || 0;

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(message);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div
        className="bg-[#242538] rounded-xl w-full max-w-sm bg-cover bg-center"
        style={{ backgroundImage: 'url(/public/dialogue-bakcground.svg)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-lg font-bold text-white">Join Event</h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>

        <div className="p-4">
          {/* Event Info */}
          <div className="mb-4">
            <h3 className="text-white font-medium mb-2">{eventTitle}</h3>
            <div className="flex flex-wrap gap-2 text-white/60 text-xs">
              <span className="bg-[#1a1b2e] px-2 py-1 rounded-full">
                {eventDetails?.category || 'Unknown Category'}
              </span>
              <span className="bg-[#1a1b2e] px-2 py-1 rounded-full flex items-center gap-1">
                <Users size={12} />
                {eventDetails?.currentParticipants || 0}/{eventDetails?.maxParticipants || 0}
              </span>
            </div>
          </div>
          
          {/* Creator Info */}
          <div className="flex items-center gap-3 mb-4">
            <img
              src={creator.avatar_url}
              alt={creator.name}
              className="w-10 h-10 rounded-full"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-white text-sm">{creator.name}</p>
                {creator.rank !== undefined && <UserRankBadge rank={creator.rank} size="sm" />}
              </div>
              <p className="text-white/60 text-xs">@{creator.username}</p>
            </div>
          </div>

          {/* Wager Amount */}
          <div className="bg-[#1a1b2e] rounded-lg p-3 mb-4 flex items-center justify-between">
            <span className="text-white/60 text-sm">Wager Amount</span>
            <span className="text-[#CCFF00] font-bold">
              ₦{wagerAmount.toLocaleString()}
            </span>
          </div>

          {/* Message Input */}
          <div className="mb-4">
            <textarea
              rows={2}
              className="w-full bg-[#1a1b2e] text-white text-sm px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CCFF00] transition-shadow"
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
              className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 px-4 py-2 bg-[#CCFF00] text-black rounded-lg hover:bg-[#b3ff00] transition"
            >
              Join Event
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JoinRequestModal;
