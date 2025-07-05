import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import LoadingSpinner from '../../components/LoadingSpinner';

interface ChallengePayoutDetailsProps {
  challengeId: string;
}

const ChallengePayoutDetails: React.FC<ChallengePayoutDetailsProps> = ({ challengeId }) => {
  const [loading, setLoading] = useState(true);
  const [payoutDetails, setPayoutDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPayoutDetails = async () => {
      setLoading(true);
      try {
        // Get challenge details
        const { data: challengeData, error: challengeError } = await supabase
          .from('challenges')
          .select(`
            *,
            creator:creator_id(username, avatar_url),
            opponent:opponent_id(username, avatar_url),
            winner:winner_id(username, avatar_url)
          `)
          .eq('id', challengeId)
          .single();

        if (challengeError) throw challengeError;

        // Get admin action details
        const { data: adminActionData, error: adminActionError } = await supabase
          .from('admin_actions')
          .select('*')
          .eq('target_id', challengeId)
          .eq('action_type', 'process_challenge_payouts')
          .order('created_at', { ascending: false })
          .limit(1);

        if (adminActionError) throw adminActionError;

        // Get transactions related to this challenge
        const { data: transactionData, error: transactionError } = await supabase
          .from('transactions')
          .select('*')
          .contains('metadata', { challenge_id: challengeId })
          .order('created_at', { ascending: false });

        if (transactionError) throw transactionError;

        setPayoutDetails({
          challenge: challengeData,
          adminAction: adminActionData?.[0]?.details || null,
          transactions: transactionData || []
        });
      } catch (err) {
        console.error('Error fetching challenge payout details:', err);
        setError('Failed to load challenge payout details');
      } finally {
        setLoading(false);
      }
    };

    if (challengeId) {
      fetchPayoutDetails();
    }
  }, [challengeId]);

  if (loading) {
    return <div className="text-center p-4">Loading...</div>;
  }

  if (error) {
    return <div className="text-sm text-red-500">{error}</div>;
  }

  if (!payoutDetails || !payoutDetails.challenge) {
    return <div className="text-sm text-gray-500">No payout details available</div>;
  }

  const { challenge, adminAction, transactions } = payoutDetails;
  
  // Calculate statistics
  const wagerAmount = challenge?.wager_amount || 0;
  const platformFee = adminAction?.platform_fee || 0;
  const winnerPayout = adminAction?.winner_payout || 0;
  const totalPool = wagerAmount * 2; // Both participants' wagers
  const platformFeePercentage = totalPool > 0 ? (platformFee / totalPool) * 100 : 0;

  return (
    <div className="bg-gray-800 rounded-lg p-4 mt-4">
      <h3 className="text-lg font-semibold mb-3">Challenge Payout Details</h3>
      
      {!challenge.payouts_processed && (
        <div className="text-sm text-yellow-500 mb-3">
          Payouts have not been processed yet.
        </div>
      )}
      
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gray-700 p-3 rounded">
          <div className="text-sm text-gray-400">Wager Amount</div>
          <div className="text-lg font-semibold">{wagerAmount.toFixed(2)} coins</div>
          <div className="text-xs text-gray-500">
            (Total pool: {totalPool.toFixed(2)} coins)
          </div>
        </div>
        <div className="bg-gray-700 p-3 rounded">
          <div className="text-sm text-gray-400">Platform Fee</div>
          <div className="text-lg font-semibold">{platformFee.toFixed(2)} coins</div>
          <div className="text-xs text-gray-500">
            ({platformFeePercentage.toFixed(1)}% of total pool)
          </div>
        </div>
        <div className="bg-gray-700 p-3 rounded">
          <div className="text-sm text-gray-400">Winner Payout</div>
          <div className="text-lg font-semibold">{winnerPayout.toFixed(2)} coins</div>
          {challenge.winner && (
            <div className="text-xs text-gray-500">
              Winner: @{challenge.winner.username}
            </div>
          )}
        </div>
        <div className="bg-gray-700 p-3 rounded">
          <div className="text-sm text-gray-400">Status</div>
          <div className="text-lg font-semibold capitalize">{challenge.status}</div>
          <div className="text-xs text-gray-500">
            {challenge.payouts_processed ? 'Payouts processed' : 'Payouts pending'}
          </div>
        </div>
      </div>

      {transactions.length > 0 && (
        <div>
          <h4 className="text-md font-semibold mb-2">Transactions</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-gray-400">
                <tr>
                  <th className="text-left p-2">Type</th>
                  <th className="text-left p-2">Amount</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx: any) => (
                  <tr key={tx.id} className="border-t border-gray-700">
                    <td className="p-2 capitalize">{tx.type.replace('_', ' ')}</td>
                    <td className="p-2">{tx.amount.toFixed(2)} coins</td>
                    <td className="p-2 capitalize">{tx.status}</td>
                    <td className="p-2">{new Date(tx.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="bg-gray-700 p-3 rounded">
          <div className="text-sm text-gray-400">Creator</div>
          <div className="text-md font-semibold">@{challenge.creator?.username}</div>
          <div className="text-xs text-gray-500">
            {challenge.creator_id === challenge.winner_id ? 'Winner' : 'Loser'}
          </div>
        </div>
        <div className="bg-gray-700 p-3 rounded">
          <div className="text-sm text-gray-400">Opponent</div>
          <div className="text-md font-semibold">@{challenge.opponent?.username}</div>
          <div className="text-xs text-gray-500">
            {challenge.opponent_id === challenge.winner_id ? 'Winner' : 'Loser'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChallengePayoutDetails;
