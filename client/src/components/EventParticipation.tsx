import { useState, useEffect } from 'react';
import { useEventParticipation } from '../hooks/useEventParticipation';
import { useEventPool } from '../hooks/useEventPool';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { ThumbsUp, ThumbsDown, Loader2 } from 'lucide-react';
import { useBetUpdates } from '../hooks/useBetUpdates';

interface EventParticipationProps {
  eventId: string;
  wagerAmount: number;
  onParticipationComplete?: () => void;
}

interface PredictionCounts {
  yes_count: number;
  no_count: number;
  total_participants: number;
}

interface MatchedBet {
  match_id: string;
  opponent_id: string;
  prediction: boolean;
  wager_amount: number;
}

export function EventParticipation({ 
  eventId, 
  wagerAmount,
  onParticipationComplete 
}: EventParticipationProps) {
  const [prediction, setPrediction] = useState<boolean | null>(null);
  const [predictionCounts, setPredictionCounts] = useState<PredictionCounts>({
    yes_count: 0,
    no_count: 0,
    total_participants: 0
  });
  const [matchedBet, setMatchedBet] = useState<MatchedBet | null>(null);
  const [participantId, setParticipantId] = useState<string | null>(null);
  
  const { currentUser } = useAuth();
  const toast = useToast();
  const { 
    joinEvent, 
    getUserPrediction,
    getPredictionCounts,
    getMatchedBet,
    isProcessing 
  } = useEventParticipation();
  const { updatePoolAmount } = useEventPool();
  const matchStatus = useBetUpdates(participantId || '');

  useEffect(() => {
    const loadData = async () => {
      if (!currentUser?.id) return;
      
      const [countsData, predictionData, matchData] = await Promise.all([
        getPredictionCounts(eventId),
        getUserPrediction(eventId, currentUser.id),
        getMatchedBet(eventId, currentUser.id)
      ]);
      
      if (countsData) setPredictionCounts(countsData);
      if (predictionData !== null) setPrediction(predictionData);
      if (matchData) setMatchedBet(matchData);
    };

    loadData();
  }, [eventId, currentUser?.id]);

  const handleJoin = async (selectedPrediction: boolean) => {
    if (!currentUser?.id) {
      toast.showError('You must be logged in to participate');
      return;
    }

    const { success, participantId: newParticipantId } = await joinEvent({
      eventId,
      userId: currentUser.id,
      prediction: selectedPrediction,
      wagerAmount
    });

    if (success) {
      setPrediction(selectedPrediction);
      if (newParticipantId) setParticipantId(newParticipantId);
      await updatePoolAmount(eventId, wagerAmount, selectedPrediction);
      const [newCounts, newMatch] = await Promise.all([
        getPredictionCounts(eventId),
        getMatchedBet(eventId, currentUser.id)
      ]);
      if (newCounts) setPredictionCounts(newCounts);
      if (newMatch) setMatchedBet(newMatch);
      onParticipationComplete?.();
    }
  };

  const yesPercentage = predictionCounts.total_participants > 0 
    ? (predictionCounts.yes_count / predictionCounts.total_participants) * 100 
    : 0;

  return (
    <div className="space-y-6 p-4 bg-gray-900 rounded-xl">
      {!prediction ? (
        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-semibold text-white">Choose Your Prediction</h3>
          <div className="flex gap-4">
            <button
              onClick={() => handleJoin(true)}
              disabled={isProcessing}
              className="flex items-center gap-2 px-6 py-3 bg-[#CCFF00] text-black font-medium rounded-lg disabled:opacity-50 hover:bg-[#CCFF00]/90 transition-colors"
            >
              <ThumbsUp className="w-5 h-5" />
              YES
            </button>
            <button
              onClick={() => handleJoin(false)}
              disabled={isProcessing}
              className="flex items-center gap-2 px-6 py-3 bg-white text-black font-medium rounded-lg disabled:opacity-50 hover:bg-white/90 transition-colors"
            >
              <ThumbsDown className="w-5 h-5" />
              NO
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-gray-800 p-4 rounded-lg">
            <p className="text-white">Your prediction: 
              <span className={prediction ? 'text-[#CCFF00]' : 'text-white'}>
                {prediction ? ' YES' : ' NO'}
              </span>
            </p>
          </div>

          {/* Matched Bet Status */}
          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              {matchStatus === 'waiting' && (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#CCFF00]" />
                  <p className="text-white">Waiting for a matching opponent...</p>
                </>
              )}
              {matchStatus === 'matched' && matchedBet && (
                <p className="text-[#CCFF00]">
                  Matched with opponent! Wager: ₦{matchedBet.wager_amount.toLocaleString()}
                </p>
              )}
              {matchStatus === 'completed' && (
                <p className="text-white">Bet has been settled</p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <div className="flex justify-between text-sm text-white/60">
          <span>YES {predictionCounts.yes_count}</span>
          <span>NO {predictionCounts.no_count}</span>
        </div>

        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div 
            className="h-full bg-[#CCFF00] transition-all duration-500"
            style={{ width: `${yesPercentage}%` }}
          />
        </div>

        <div className="pt-4 space-y-2 border-t border-white/10">
          <p className="text-white/60">Total Participants: <span className="text-white">{predictionCounts.total_participants}</span></p>
        </div>
      </div>
    </div>
  );
}