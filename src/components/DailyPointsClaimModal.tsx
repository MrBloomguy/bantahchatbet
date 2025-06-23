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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 pointer-events-auto">
      {/* Debug: Log claimResult and alreadyClaimed */}
      {(() => { console.log('[DailyPointsClaimModal] Render', { claimResult, alreadyClaimed, loading, lastClaimedDate }); return null; })()}
      {/* Confetti Burst Animation (on claim) */}
      {claimResult && claimResult.success && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-20">
          {/* Debug: Confetti shown */}
          {(() => { console.log('[DailyPointsClaimModal] Confetti burst shown'); return null; })()}
          <svg width="220" height="120" viewBox="0 0 220 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="animate-fade-burst">
            <g>
              <circle cx="30" cy="60" r="6" fill="#FFB800" />
              <circle cx="60" cy="30" r="4" fill="#7440FF" />
              <circle cx="110" cy="20" r="7" fill="#FF4D4D" />
              <circle cx="170" cy="40" r="5" fill="#FFB800" />
              <circle cx="200" cy="80" r="6" fill="#7440FF" />
              <circle cx="180" cy="100" r="4" fill="#FF4D4D" />
              <circle cx="120" cy="100" r="5" fill="#FFB800" />
              <circle cx="80" cy="90" r="4" fill="#7440FF" />
            </g>
          </svg>
          <style>{`
            .animate-fade-burst {
              animation: fade-burst 1.2s cubic-bezier(0.4,0,0.2,1);
            }
            @keyframes fade-burst {
              0% { opacity: 0; transform: scale(0.7); }
              20% { opacity: 1; transform: scale(1.1); }
              60% { opacity: 1; transform: scale(1); }
              100% { opacity: 0; transform: scale(1.2); }
            }
          `}</style>
        </div>
      )}
      <div className="relative bg-white rounded-3xl shadow-2xl p-8 w-full max-w-xs flex flex-col items-center z-10 border-2 border-[#7440FF]/10">
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 bg-white/80 rounded-full p-1 shadow"
          onClick={onClose}
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
        {/* Glowing Gift Icon */}
        <div className="relative mb-3">
          <div className="absolute inset-0 blur-xl opacity-60 bg-gradient-to-tr from-[#7440FF] via-[#FFB800] to-[#FF4D4D] rounded-full w-20 h-20 animate-pulse" />
          <Gift className="w-16 h-16 text-[#7440FF] drop-shadow-lg relative z-10" />
        </div>
        <h2 className="text-2xl font-extrabold mb-1 text-center text-[#7440FF] tracking-tight">Daily Bonus!</h2>
        <div className="flex items-center justify-center mb-2">
          <span className="text-4xl font-black text-[#FFB800] drop-shadow-sm mr-2">+500</span>
          <span className="text-lg font-bold text-[#7440FF]">Points</span>
        </div>
        <p className="text-gray-600 text-center mb-4 text-sm">Log in every day to claim your reward and keep your streak going!</p>
        {claimResult ? (
          <div className={`flex flex-col items-center mb-2 ${claimResult.success ? 'text-green-600' : 'text-red-500'}`}>
            {/* Debug: Show claim result */}
            {(() => { console.log('[DailyPointsClaimModal] Claim result', claimResult); if (!claimResult.success) console.error('[DailyPointsClaimModal] Claim error:', claimResult.message); return null; })()}
            {claimResult.success ? <CheckCircle className="w-8 h-8 mb-1 animate-bounce" /> : <X className="w-8 h-8 mb-1 animate-shake" />}
            <span className="font-medium text-center">{claimResult.message}</span>
          </div>
        ) : alreadyClaimed ? (
          <div className="flex flex-col items-center mb-2 text-green-600">
            <CheckCircle className="w-8 h-8 mb-1 animate-bounce" />
            <span className="font-medium text-center">Already claimed today!</span>
          </div>
        ) : null}
        <button
          className={`mt-2 w-full py-3 rounded-xl font-extrabold text-lg shadow transition-all duration-200 ${alreadyClaimed || loading ? 'bg-gray-300 text-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-[#7440FF] via-[#FFB800] to-[#FF4D4D] text-white hover:scale-105'}`}
          onClick={async () => {
            console.log('[DailyPointsClaimModal] Claim button clicked');
            try {
              await onClaim();
            } catch (err) {
              console.error('[DailyPointsClaimModal] Error during claim:', err);
            }
          }}
          disabled={alreadyClaimed || loading}
        >
          {loading ? 'Claiming...' : 'Claim 500 Points'}
        </button>
      </div>
      {/* Remove background confetti animation */}
      {/* <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute w-full h-full animate-confetti" style={{ background: 'repeating-linear-gradient(135deg, #f3e8ff 0 20px, #ffe4e6 20px 40px, #e0f2fe 40px 60px, #f3e8ff 60px 80px)' }} />
      </div> */}
      <style>{`
        .animate-bounce { animation: bounce 0.7s; }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-shake { animation: shake 0.5s; }
        @keyframes shake {
          0% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          50% { transform: translateX(4px); }
          75% { transform: translateX(-4px); }
          100% { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
};

export default DailyPointsClaimModal;
