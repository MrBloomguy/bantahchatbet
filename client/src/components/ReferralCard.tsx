import React, { useState } from 'react';
import { Share2, Copy, Check, Users, Gift, TrendingUp } from 'lucide-react';
import { useReferral } from '../hooks/useReferral';

const ReferralCard: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const { referralCode, stats, generateReferralCode } = useReferral();

  const handleCopy = async () => {
    if (referralCode) {
      await navigator.clipboard.writeText(referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    if (referralCode) {
      try {
        await navigator.share({
          title: 'Join me on Bantah',
          text: `Use my referral code ${referralCode} to join Bantah and start betting on anything!`,
          url: window.location.origin
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    }
  };

  return (
    <div className="bg-[#242538] rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Refer & Earn</h2>
        <button
          onClick={handleShare}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <Share2 className="w-5 h-5 text-[#CCFF00]" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-[#1a1b2e] rounded-lg p-3">
          <div className="w-8 h-8 rounded-lg bg-[#CCFF00]/20 flex items-center justify-center mb-2">
            <Users className="w-4 h-4 text-[#CCFF00]" />
          </div>
          <p className="text-white/60 text-sm">Total Referrals</p>
          <p className="text-white font-bold">{stats.totalReferrals}</p>
        </div>
        <div className="bg-[#1a1b2e] rounded-lg p-3">
          <div className="w-8 h-8 rounded-lg bg-[#CCFF00]/20 flex items-center justify-center mb-2">
            <Gift className="w-4 h-4 text-[#CCFF00]" />
          </div>
          <p className="text-white/60 text-sm">Total Points Earned</p>
          <p className="text-[#CCFF00] font-bold">{stats.totalRewards.toLocaleString()} pts</p>
        </div>
      </div>

      <div className="bg-[#1a1b2e] rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-white/60 text-sm">Your Referral Code</span>
            <p className="text-white font-syne text-xl font-bold tracking-wider">
              {referralCode || '--------'}
            </p>
          </div>
          <button
            onClick={handleCopy}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            {copied ? (
              <Check className="w-5 h-5 text-[#CCFF00]" />
            ) : (
              <Copy className="w-5 h-5 text-white/60" />
            )}
          </button>
        </div>
      </div>

      <p className="text-white/60 text-sm mt-4">
        Earn points for every 10 friends who join using your referral code. Plus, get bonus points when they create events or join groups!
      </p>
    </div>
  );
};

export default ReferralCard;