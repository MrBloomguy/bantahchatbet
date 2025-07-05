import React from 'react';
import { X, Share2, Facebook, Twitter } from 'lucide-react';

interface ShareResultModalProps {
  event: {
    id: string;
    type: 'challenge' | 'group_event';
    title: string;
    category: string;
    amount: number;
    outcome: 'won' | 'lost';
    date: string;
    earnings?: number;
    opponent?: {
      name: string;
      avatar_url: string;
    };
    group?: {
      name: string;
      avatar_url: string;
      total_participants: number;
    };
  };
  onClose: () => void;
  onShare: () => void;
}

const ShareResultModal: React.FC<ShareResultModalProps> = ({ event, onClose, onShare }) => {
  const getGradientClass = () => {
    if (event.outcome === 'won') {
      return 'bg-gradient-to-br from-[#CCFF00] to-[#7C3AED]';
    }
    return 'bg-gradient-to-br from-[#FF4B4B] to-[#7C3AED]';
  };

  const getEmoji = () => {
    if (event.type === 'challenge') {
      return event.outcome === 'won' ? '🎮 🏆' : '🎮 💔';
    }
    return event.outcome === 'won' ? '👥 🏆' : '👥 💔';
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-md">
        {/* Share Card */}
        <div className={`${getGradientClass()} rounded-xl p-6 text-center mb-4`}>
          <div className="bg-black/20 rounded-xl p-6">
            <h2 className="text-4xl font-bold text-white mb-4">
              {event.outcome === 'won' ? "IT'S A WIN!" : "CLOSE ONE!"}
            </h2>
            
            <p className="text-white/80 mb-2">
              {event.type === 'challenge' 
                ? `You ${event.outcome} against ${event.opponent?.name}`
                : `You ${event.outcome} in ${event.group?.name}`}
            </p>
            
            <p className="text-white mb-4">{event.title}</p>

            <div className="text-6xl mb-4">{getEmoji()}</div>

            <div className="bg-black/20 rounded-full py-2 px-4 inline-block">
              <span className="text-white/60 mr-2">EVENT ID</span>
              <span className="text-white font-mono">#{event.id}</span>
            </div>

            <div className="mt-6">
              <div className="text-4xl font-bold text-white mb-1">
                ₦ {event.amount.toLocaleString()}
              </div>
              {event.earnings && (
                <div className="text-[#CCFF00] font-bold">
                  +₦ {event.earnings.toLocaleString()}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Share Options */}
        <div className="bg-[#242538] rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-medium">Share Result</h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white/60" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onShare}
              className="flex items-center justify-center gap-2 p-3 bg-[#1877F2] text-white rounded-lg hover:bg-[#1877F2]/90 transition-colors"
            >
              <Facebook className="w-5 h-5" />
              <span>Facebook</span>
            </button>
            <button
              onClick={onShare}
              className="flex items-center justify-center gap-2 p-3 bg-[#1DA1F2] text-white rounded-lg hover:bg-[#1DA1F2]/90 transition-colors"
            >
              <Twitter className="w-5 h-5" />
              <span>Twitter</span>
            </button>
            <button
              onClick={onShare}
              className="flex items-center justify-center gap-2 p-3 bg-[#CCFF00] text-black rounded-lg hover:bg-[#b3ff00] transition-colors col-span-2"
            >
              <Share2 className="w-5 h-5" />
              <span>Share</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareResultModal;