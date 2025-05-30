import React from 'react';
import { CheckCircle, Gift, X } from 'lucide-react';

interface DailyPointsClaimModalProps {
  open: boolean;
  onClose: () => void;
  onClaim: () => Promise<{ success: boolean; message: string }>;
  lastClaimedDate: string | null;
  loading: boolean;
  claimResult?: { success: boolean; message: string } | null;
}

const DailyPointsClaimModal: React.FC<DailyPointsClaimModalProps> = ({
  open,
  onClose,
  onClaim,
  lastClaimedDate,
  loading,
  claimResult
}) => {
  if (!open) return null;

  const today = new Date().toISOString().slice(0, 10);
  const alreadyClaimed = lastClaimedDate && lastClaimedDate.slice(0, 10) === today;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-xs relative flex flex-col items-center">
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
          onClick={onClose}
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
        <Gift className="w-14 h-14 text-[#7440FF] mb-2" />
        <h2 className="text-xl font-bold mb-1 text-center">Daily Login Bonus</h2>
        <p className="text-gray-600 text-center mb-4">
          Claim <span className="font-semibold text-[#7440FF]">500 points</span> for logging in today!
        </p>
        {claimResult ? (
          <div className={`flex flex-col items-center mb-2 ${claimResult.success ? 'text-green-600' : 'text-red-500'}`}>
            {claimResult.success ? <CheckCircle className="w-8 h-8 mb-1" /> : <X className="w-8 h-8 mb-1" />}
            <span className="font-medium">{claimResult.message}</span>
          </div>
        ) : alreadyClaimed ? (
          <div className="flex flex-col items-center mb-2 text-green-600">
            <CheckCircle className="w-8 h-8 mb-1" />
            <span className="font-medium">Already claimed today!</span>
          </div>
        ) : null}
        <button
          className={`mt-2 w-full py-2 rounded-lg font-semibold text-white transition-colors ${alreadyClaimed || loading ? 'bg-gray-300 cursor-not-allowed' : 'bg-[#7440FF] hover:bg-[#5a2fd3]'}`}
          onClick={onClaim}
          disabled={alreadyClaimed || loading}
        >
          {loading ? 'Claiming...' : 'Claim 500 Points'}
        </button>
      </div>
    </div>
  );
};

export default DailyPointsClaimModal;
