import React, { useState } from 'react';
import DailyPointsClaimModal from './DailyPointsClaimModal';
import { useDailyClaim } from '../hooks/useDailyClaim';

const ClaimDailyPointsContainer = () => {
  const { claimDailyPoints, lastClaimedDate, loading } = useDailyClaim();
  const [modalOpen, setModalOpen] = useState(false);
  const [claimResult, setClaimResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleClaim = async () => {
    const result = await claimDailyPoints();
    setClaimResult(result);
    return result; // Ensure the modal gets the result for correct typing
  };

  return (
    <>
      <button onClick={() => setModalOpen(true)} className="px-4 py-2 bg-purple-600 text-white rounded-lg font-bold shadow hover:bg-purple-700 transition">Claim Daily Points</button>
      <DailyPointsClaimModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setClaimResult(null); }}
        onClaim={handleClaim}
        lastClaimedDate={lastClaimedDate}
        loading={loading}
        claimResult={claimResult}
      />
    </>
  );
};

export default ClaimDailyPointsContainer;
