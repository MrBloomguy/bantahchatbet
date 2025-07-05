import React, { useState } from 'react';
import { X, Twitter, Facebook, Send, Copy, Link } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import LoadingSpinner from './LoadingSpinner';

interface ShareChallengeModalProps {
  challenge: {
    id: string;
    title: string;
    amount: number;
    type: string;
  };
  onClose: () => void;
}

const ShareChallengeModal: React.FC<ShareChallengeModalProps> = ({ challenge, onClose }) => {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const toast = useToast();

  const baseUrl = window.location.origin;
  const challengeUrl = `${baseUrl}/challenge/${challenge.id}?ref=${username}`;
  const encodedUrl = encodeURIComponent(challengeUrl);
  const encodedTitle = encodeURIComponent(`${challenge.title} - ₦${challenge.amount.toLocaleString()} ${challenge.type} Challenge`);
  const encodedDescription = encodeURIComponent(`Hey @${username}, I challenge you to a ${challenge.type} match! Join me on Bantah and let's play!`);

  const socialLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${encodedDescription}&url=${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedDescription}`
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(challengeUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.showSuccess('Challenge link copied to clipboard!');
    } catch (error) {
      toast.showError('Failed to copy link');
    }
  };

  const handleShare = async (platform: 'twitter' | 'facebook' | 'telegram') => {
    if (!username) {
      toast.showError('Please enter a username');
      return;
    }

    try {
      setLoading(true);
      window.open(socialLinks[platform], '_blank');
      onClose();
    } catch (error) {
      console.error('Error sharing:', error);
      toast.showError('Failed to share challenge');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-[#242538] rounded-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-bold text-white">Share Challenge</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Username Input */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Opponent's Username
            </label>
            <div className="flex items-center gap-2">
              <span className="text-white/60">@</span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="flex-1 bg-[#1a1b2e] text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CCFF00] transition-shadow"
                placeholder="Enter username"
                disabled={loading}
              />
            </div>
          </div>

          {/* Challenge Link */}
          <div className="bg-[#1a1b2e] rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 truncate mr-4">
                <p className="text-white/60 text-sm mb-1">Challenge Link</p>
                <p className="text-white truncate">{challengeUrl}</p>
              </div>
              <button
                onClick={handleCopy}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                {copied ? (
                  <div className="text-[#CCFF00]">Copied!</div>
                ) : (
                  <Copy className="w-5 h-5 text-white/60" />
                )}
              </button>
            </div>
          </div>

          {/* Share Buttons */}
          <div className="grid grid-cols-3 gap-4">
            <button
              onClick={() => handleShare('twitter')}
              disabled={loading || !username}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-[#7440ff] text-white rounded-xl hover:bg-[#7440ff]/90 transition-colors disabled:opacity-50"
            >
              <Twitter className="w-6 h-6" />
              <span className="text-sm">Twitter</span>
            </button>

            <button
              onClick={() => handleShare('facebook')}
              disabled={loading || !username}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-[#7440ff] text-white rounded-xl hover:bg-[#7440ff]/90 transition-colors disabled:opacity-50"
            >
              <Facebook className="w-6 h-6" />
              <span className="text-sm">Facebook</span>
            </button>

            <button
              onClick={() => handleShare('telegram')}
              disabled={loading || !username}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-[#7440ff] text-white rounded-xl hover:bg-[#7440ff]/90 transition-colors disabled:opacity-50"
            >
              <Send className="w-6 h-6" />
              <span className="text-sm">Telegram</span>
            </button>
          </div>

          {/* Note */}
          <p className="text-white/60 text-sm text-center">
            Your opponent will receive a notification when they join using your challenge link
          </p>
        </div>
      </div>
    </div>
  );
};

export default ShareChallengeModal;
