import React from 'react';
import { X, AlertCircle, Trophy, Wallet } from 'lucide-react';
import { Dialog } from './ui/dialog';
import { useWallet } from '../contexts/WalletContext';

interface BetConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  prediction: 'YES' | 'NO';
  eventDetails: {
    title: string;
    endTime: string;
    wagerAmount: number;
    pool?: {
      entry_amount: number;
    }[];
  };
}

const BetConfirmationModal: React.FC<BetConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  prediction,
  eventDetails
}) => {
  const { wallet } = useWallet();
  const balance = wallet?.real_balance ?? 0;
  const wagerAmount = eventDetails?.pool?.[0]?.entry_amount ?? eventDetails?.wagerAmount ?? 0;
  const hasEnoughBalance = balance >= wagerAmount;

  const formatAmount = (amount: number) => {
    try {
      return amount.toLocaleString();
    } catch (error) {
      return '0';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-dark-card rounded-xl w-full max-w-sm">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-[#CCFF00]" />
              <h2 className="text-base font-semibold text-white">Confirm Prediction</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-white/60" />
            </button>
          </div>

          <div className="p-4 space-y-4">
            {/* Event Info & Prediction Summary */}
            <div className="bg-white/5 rounded-lg p-3 space-y-3">
              <div>
                <h3 className="text-sm text-white/80 font-medium">{eventDetails?.title || 'Event'}</h3>
                <div className="text-xs text-white/60">
                  Ends: {eventDetails?.endTime ? new Date(eventDetails.endTime).toLocaleDateString() : 'TBD'}
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm border-t border-white/10 pt-3">
                <span className="text-white/80">Your Prediction</span>
                <span className={`font-medium ${
                  prediction === 'YES' ? 'text-green-400' : 'text-red-400'
                }`}>
                  {prediction}
                </span>
              </div>
              
              {/* Add wallet balance info */}
              <div className="flex items-center justify-between text-sm border-t border-white/10 pt-3">
                <span className="text-white/80">Your Balance</span>
                <span className={`font-medium flex items-center gap-1 ${
                  hasEnoughBalance ? 'text-[#CCFF00]' : 'text-red-400'
                }`}>
                  <Wallet className="w-3 h-3" />
                  ₦{formatAmount(balance)}
                </span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/80">Wager Amount</span>
                <span className="text-[#CCFF00] font-medium">
                  ₦{formatAmount(wagerAmount)}
                </span>
              </div>
            </div>

            {/* Show insufficient balance warning if needed */}
            {!hasEnoughBalance && (
              <div className="flex items-start gap-2 bg-red-500/10 rounded-lg p-3">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400 mt-0.5" />
                <div className="text-xs text-red-400">
                  Insufficient balance. You need ₦{formatAmount(wagerAmount)} to join this event.
                </div>
              </div>
            )}

            {/* Notice */}
            <div className="flex items-start gap-2 bg-white/5 rounded-lg p-3">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-[#CCFF00] mt-0.5" />
              <div className="text-xs text-white/60">
                Your stake will be locked until a matching opponent is found or the event concludes. 
                Unmatched stakes are automatically returned.
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-3 border-t border-white/10 flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 py-2 rounded-lg font-medium border border-white/20 text-white/80 hover:bg-white/10 transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={!hasEnoughBalance}
              className={`flex-1 py-2 rounded-lg font-medium text-sm ${
                hasEnoughBalance 
                  ? 'bg-[#7440ff] hover:bg-[#7440ff]/90 text-white'
                  : 'bg-white/10 text-white/60 cursor-not-allowed'
              }`}
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    </Dialog>
  );
};

export default BetConfirmationModal;
