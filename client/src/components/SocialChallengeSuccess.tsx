import React from 'react';
import { Check, Copy, Share2, X } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

interface SocialChallengeSuccessProps {
  platform: string;
  username: string;
  amount: number;
  title: string;
  link: string;
  onClose: () => void;
}

const SocialChallengeSuccess: React.FC<SocialChallengeSuccessProps> = ({
  platform,
  username,
  amount,
  title,
  link,
  onClose
}) => {
  const toast = useToast();
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.showSuccess('Challenge link copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.showError('Failed to copy link');
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: `${title} - Bantah Challenge`,
        text: `Join my ${title} challenge for ₦${amount.toLocaleString()}!`,
        url: link
      });
    } catch (error) {
      console.error('Error sharing:', error);
      handleCopy();
    }
  };

  const shortLink = link.substring(link.lastIndexOf('/') + 1);

    return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-[#242538] rounded-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-bold text-white">Challenge Sent!</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>

        {/* Content */}
        <div className="p-3 space-y-3">
          {/* Success Message */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#CCFF00]/20 flex items-center justify-center">
              <Check className="w-5 h-5 text-[#CCFF00]" />
            </div>
            <div>
              <h3 className="text-white font-medium text-sm">Challenge Created</h3>
              <p className="text-white/60 text-xs">
                Waiting for {platform === 'twitter' ? 'Twitter' : 'Telegram'} user @{username} to accept
                            </p>
            </div>
          </div>

          {/* Challenge Details */}
          <div className="bg-[#1a1b2e] rounded-xl p-3 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-white/60">Title</span>
              <span className="text-white text-sm">{title}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/60">Amount</span>
              <span className="text-[#CCFF00] font-bold text-sm">₦{amount.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/60">Status</span>
              <span className="text-yellow-500 text-sm">Awaiting Acceptance</span>
            </div>
          </div>

          {/* Challenge Link */}
          <div className="bg-[#1a1b2e] rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/60">Challenge Link</span>
              <button
                onClick={handleCopy}
                className="text-[#CCFF00] text-xs hover:underline"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
                        <p className="text-white text-xs break-all" title={link}>
              {link.substring(link.lastIndexOf('/') + 1)}
            </p>
          </div>

          {/* Share Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleCopy}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-[#1a1b2e] text-white rounded-xl hover:bg-[#2f3049] transition-colors"
                        >
                            <Copy className="w-5 h-5" />
                            <span>Copy Link</span>
                        </button>
            <button
              onClick={handleShare}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-[#CCFF00] text-black rounded-xl hover:bg-[#b3ff00] transition-colors"
                        >
              <Share2 className="w-5 h-5" />
              <span>Share</span>
            </button>
          </div>

          <p className="text-white/60 text-sm text-center">
            We'll notify you when @{username} accepts your challenge
          </p>
        </div>
      </div>
    </div>
  );
};

export default SocialChallengeSuccess;