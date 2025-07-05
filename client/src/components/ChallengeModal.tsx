import React, { useState } from 'react';
import { X, Calendar, AlertCircle, DollarSign, Star, Gift, Award, Share2 } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';
import LoadingSpinner from './LoadingSpinner';
import UserLevelBadge from './UserLevelBadge';

type GameType = 'FIFA' | 'NBA2K' | 'OTHER';
type Platform = 'PS5' | 'XBOX' | 'PC';

interface ChallengeModalProps {
  challengerId: string;
  challengedId: string;
  challengedName: string;
  challengedUsername: string;
  challengedAvatar: string;
  challengedPoints: number;
  challengedGifts: number;
  challengedLevel: number;
  onClose: () => void;
  onSuccess: () => void;
}

const ChallengeModal: React.FC<ChallengeModalProps> = ({
  challengerId,
  challengedId,
  challengedName,
  challengedUsername,
  challengedAvatar,
  challengedPoints,
  challengedGifts,
  challengedLevel,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [challengeData, setChallengeData] = useState({
    amount: 100,
    gameType: '' as GameType,
    platform: '' as Platform,
    scheduledDate: '',
    scheduledTime: '',
    evidence: 'SCREENSHOT' as 'SCREENSHOT' | 'VIDEO' | 'IMAGES',
    expirationHours: 24,
  });
  const [customGame, setCustomGame] = useState('');
  const [createdChallenge, setCreatedChallenge] = useState<any>(null);

  const { wallet } = useWallet();
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);

      if (!wallet || wallet.real_balance < challengeData.amount) {
        toast.showError('Insufficient balance');
        return;
      }

      let status = 'pending';
      let scheduledAt = null;

      if (challengeData.scheduledDate && challengeData.scheduledTime) {
        scheduledAt = new Date(
          `${challengeData.scheduledDate}T${challengeData.scheduledTime}`
        ).toISOString();
      }

      const expirationTime = new Date();
      expirationTime.setHours(
        expirationTime.getHours() + challengeData.expirationHours
      );

      const title = `${challengeData.gameType} Challenge vs ${challengedName}`;

      const { data: challenge, error } = await supabase
        .from('challenges')
        .insert({
          challenger_id: challengerId,
          challenged_id: challengedId,
          amount: challengeData.amount,
          title,
          game_type: challengeData.gameType,
          custom_game_name: challengeData.gameType === 'OTHER' ? customGame : null,
          platform: challengeData.platform,
          scheduled_at: scheduledAt,
          expires_at: expirationTime.toISOString(),
          required_evidence: challengeData.evidence,
          status: status,
        })
        .select()
        .single();

      if (error) throw error;
      setCreatedChallenge(challenge); // Store the created challenge for sharing

      const { data: challengerData, error: challengerError } = await supabase
        .from('users')
        .select('username')
        .eq('id', challengerId)
        .single();

      if (challengerError) throw challengerError;

      await supabase.from('notifications').insert({
        user_id: challengedId,
        type: 'challenge_received',
        title: 'New Challenge Received',
        content: `@${challengerData.username} has challenged you to a ${challengeData.gameType} match.`,
        metadata: {
          challenge_id: challenge.id,
          challenger_id: challengerId,
          game_type: challengeData.gameType,
          amount: challengeData.amount,
        },
      });

      onSuccess?.();
      toast.showSuccess('Challenge created successfully!');
    } catch (error) {
      console.error('Error creating challenge:', error);
      toast.showError('Failed to create challenge');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[2rem] w-full max-w-[320px] shadow-xl border overflow-hidden flex flex-col items-center p-0">
        {/* Header: Avatar, Name, Username, Share, Close */}
        <div className="w-full flex flex-col items-center pt-6 pb-2 px-4 relative">
          {/* Share and Close buttons - tightly aligned top-left */}
          <div className="absolute top-3 left-3 z-20">
            {createdChallenge ? (
              <button
                type="button"
                onClick={async (e) => {
                  e.stopPropagation();
                  const url = `${window.location.origin}/challenge/${createdChallenge.id}`;
                  let message = '';
                  switch (createdChallenge.status) {
                    case 'pending':
                      message = `I've invited you to a challenge!\nView and accept: ${url}`;
                      break;
                    case 'accepted':
                      message = `A challenge is on! See details: ${url}`;
                      break;
                    case 'completed':
                      message = `Check out the results of our challenge: ${url}`;
                      break;
                    default:
                      message = `Check out this challenge: ${url}`;
                  }
                  await navigator.clipboard.writeText(message);
                  toast.showSuccess('Challenge link copied!');
                }}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full bg-white/80"
                aria-label="Share challenge"
                title="Share challenge"
              >
                <Share2 className="w-5 h-5" />
              </button>
            ) : null}
          </div>
          <div className="absolute top-3 right-3 z-20">
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-full bg-white/80"
              aria-label="Close challenge modal"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <img
            src={
              challengedAvatar ||
              `https://api.dicebear.com/7.x/avataaars/svg?seed=${challengedId}`
            }
            alt={challengedName}
            className="w-10 h-10 rounded-full ring-2 ring-purple-100 shadow mb-1"
          />
          <h2 className="text-base font-semibold text-gray-800 mt-1">
            {challengedName}
          </h2>
          <p className="text-xs text-gray-400 mb-1">
            @{challengedUsername}
          </p>
          {/* Badges row */}
          <div className="flex items-center gap-2 mb-2">
            <span className="flex items-center gap-0.5 text-[11px] text-yellow-500" title="Points">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-500" strokeWidth={0} />
              {challengedPoints}
            </span>
            <span className="flex items-center gap-0.5 text-[11px] text-pink-500" title="Gifts">
              <Gift className="w-4 h-4 text-pink-500" strokeWidth={2} />
              {challengedGifts}
            </span>
            <span className="flex items-center gap-0.5 text-[11px] text-blue-500" title="Level">
              <UserLevelBadge points={challengedPoints} size="xs" showLabel={false} />
              {challengedLevel}
            </span>
          </div>
        </div>

        {/* Amount */}
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-2 px-3 pb-3">
          {/* Amount */}
          <div className="relative flex flex-col items-center">
            <label className="absolute left-2 -top-4 text-[10px] text-gray-400 font-medium">Amount</label>
            <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
              <span className="h-4 w-4 text-[#7440ff] font-small text-md">₦</span>
            </div>
            <input
              type="number"
              value={challengeData.amount}
              onChange={e => setChallengeData(prev => ({ ...prev, amount: parseInt(e.target.value) }))}
              className="w-28 pl-7 pr-7 py-1.5 border border-gray-200 rounded-lg text-base font-semibold text-gray-700 focus:ring-1  text-center"
              min="100"
              placeholder="₦"
              required
              style={{ maxWidth: 110 }}
            />
            {/* Tiny wallet balance in top-right of field */}
            {wallet && (
              <span className="absolute right-2 top-0 text-[10px] text-gray-600 font-medium select-none">
                ₦{wallet.real_balance.toLocaleString()}
              </span>
            )}
            {wallet && wallet.real_balance < challengeData.amount && (
              <span className="absolute right-2 bottom-0 text-[10px] text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Insufficient
              </span>
            )}
          </div>

          {/* Game Type Pills */}
          <div className="flex gap-1 justify-center">
            <span className="text-[10px] text-gray-400 font-medium self-center">Event</span>
            {["Sports", "Music", "Games", "Other"].map(type => (
              <button
                key={type}
                type="button"
                onClick={() => {
                  setChallengeData(prev => ({ ...prev, gameType: type as GameType }));
                  if (type !== 'OTHER') setCustomGame('');
                }}
                className={`px-2 py-1 rounded-full text-[11px] font-medium border transition-all ${
                  challengeData.gameType === type
                    ? "bg-[#7440ff] text-white"
                    : "bg-gray-100 text-gray-700 border-gray-200 hover:bg-purple-50"
                }`}
              >
                {type === 'OTHER' ? 'Other' : type}
              </button>
            ))}
          </div>
          {challengeData.gameType === 'OTHER' && (
            <input
              type="text"
              value={customGame}
              onChange={e => setCustomGame(e.target.value)}
              placeholder="Enter game name"
              className="w-full px-2 py-1 border border-gray-200 rounded-lg text-xs mt-1 focus:ring-2 focus:ring-purple-500"
              maxLength={32}
              required
            />
          )}

          {/* Platform Pills */}
          <div className="flex gap-1 justify-center">
            <span className="text-[10px] text-gray-400 font-medium self-center">Platform</span>
            {["Party", "Outdoor", "Other"].map(platform => (
              <button
                key={platform}
                type="button"
                onClick={() => setChallengeData(prev => ({ ...prev, platform: platform as Platform }))}
                className={`px-2 py-1 rounded-full text-[11px] font-medium border transition-all ${
                  challengeData.platform === platform
                    ? "bg-[#7440ff] text-white"
                    : "bg-gray-100 text-gray-700 border-gray-200 hover:bg-purple-50"
                }`}
              >
                {platform}
              </button>
            ))}
          </div>

          {/* Evidence Pills */}
          <div className="flex gap-1 justify-center">
            <span className="text-[10px] text-gray-400 font-medium self-center">Proof</span>
            {["SCREENSHOT", "VIDEO", "IMAGES"].map(evidence => (
              <button
                key={evidence}
                type="button"
                onClick={() => setChallengeData(prev => ({ ...prev, evidence }))}
                className={`px-2 py-1 rounded-full text-[11px] font-medium border transition-all ${
                  challengeData.evidence === evidence
                    ? "bg-[#7440ff] text-white"
                    : "bg-gray-100 text-gray-700 border-gray-200 hover:bg-purple-50"
                }`}
              >
                {evidence.charAt(0) + evidence.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          {/* Schedule (progressive) */}
          <div className="flex flex-col items-center gap-1">
            <button
              type="button"
              onClick={() => setChallengeData(prev => ({
                ...prev,
                scheduledDate: prev.scheduledDate ? '' : new Date().toISOString().split('T')[0],
                scheduledTime: prev.scheduledTime ? '' : '12:00',
              }))}
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium border transition-all ${
                challengeData.scheduledDate
                  ? 'bg-purple-600 text-white border-purple-600'
                  : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-purple-50'
              }`}
            >
              <Calendar className="w-3 h-3" />
              {challengeData.scheduledDate ? 'Scheduled' : 'Schedule'}
            </button>
            {challengeData.scheduledDate && (
              <div className="flex gap-1 w-full justify-center">
                <input
                  type="date"
                  value={challengeData.scheduledDate}
                  onChange={e => setChallengeData(prev => ({ ...prev, scheduledDate: e.target.value }))}
                  className="px-2 py-1 border border-gray-200 rounded-lg text-[11px]"
                />
                <input
                  type="time"
                  value={challengeData.scheduledTime}
                  onChange={e => setChallengeData(prev => ({ ...prev, scheduledTime: e.target.value }))}
                  className="px-2 py-1 border border-gray-200 rounded-lg text-[11px]"
                />
              </div>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={
              loading ||
              !challengeData.amount ||
              !challengeData.gameType ||
              !challengeData.platform ||
              (challengeData.gameType === 'OTHER' && !customGame.trim())
            }
            className="w-full bg-[#BEFF07] text-black font-semibold py-2 rounded-xl mt-1 transition text-sm"
          >
            {loading ? (
              <div className="flex justify-center items-center gap-2">
                <LoadingSpinner size="sm" />
                Requesting...
              </div>
            ) : (
              'Challenge'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChallengeModal;
