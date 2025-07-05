import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface PayoutDetailsProps {
  eventId: string;
}

const SimpleEventPayoutDetails: React.FC<PayoutDetailsProps> = ({ eventId }) => {
  const [loading, setLoading] = useState(true);
  const [payoutDetails, setPayoutDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPayoutDetails = async () => {
      setLoading(true);
      try {
        // Get event pool details
        const { data: poolsData, error: poolError } = await supabase
          .from('event_pools')
          .select('*')
          .eq('event_id', eventId);

        if (poolError) throw poolError;

        // Use the most recent pool or combine them
        const poolData = poolsData && poolsData.length > 0
          ? poolsData.reduce((acc, pool) => {
              return {
                ...acc,
                total_amount: (acc.total_amount || 0) + (pool.total_amount || 0),
                platform_fee: (acc.platform_fee || 0) + (pool.platform_fee || 0),
                creator_fee: (acc.creator_fee || 0) + (pool.creator_fee || 0),
                admin_liquidity: (acc.admin_liquidity || 0) + (pool.admin_liquidity || 0),
                yes_pool: (acc.yes_pool || 0) + (pool.yes_pool || 0),
                no_pool: (acc.no_pool || 0) + (pool.no_pool || 0),
              };
            }, {})
          : null;

        // Get admin action details
        const { data: adminActionData, error: adminActionError } = await supabase
          .from('admin_actions')
          .select('*')
          .eq('target_id', eventId)
          .eq('action_type', 'process_payouts')
          .order('created_at', { ascending: false })
          .limit(1);

        if (adminActionError) throw adminActionError;

        setPayoutDetails({
          pool: poolData,
          adminAction: adminActionData?.[0]?.details || null
        });
      } catch (err) {
        console.error('Error fetching payout details:', err);
        setError('Failed to load payout details');
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      fetchPayoutDetails();
    }
  }, [eventId]);

  if (loading) {
    return <div className="text-center p-4">Loading...</div>;
  }

  if (error) {
    return <div className="text-sm text-red-500">{error}</div>;
  }

  if (!payoutDetails) {
    return <div className="text-sm text-gray-500">No payout details available</div>;
  }

  // If there's no pool data, show a message but still display admin action data if available
  const noPoolData = !payoutDetails.pool;

  const { pool, adminAction } = payoutDetails;

  // Calculate statistics
  const totalPool = pool?.total_amount || 0;
  const platformFee = pool?.platform_fee || 0;
  const creatorFee = pool?.creator_fee || 0;

  // Handle the case where admin_liquidity column might not exist yet
  const adminLiquidity = typeof pool?.admin_liquidity !== 'undefined' ? pool.admin_liquidity : 0;

  // If yes_pool and no_pool exist, use them; otherwise, calculate from total - admin_liquidity
  const hasPoolBreakdown = typeof pool?.yes_pool !== 'undefined' && typeof pool?.no_pool !== 'undefined';
  const userPool = hasPoolBreakdown
    ? (pool?.yes_pool || 0) + (pool?.no_pool || 0)
    : Math.max(0, totalPool - adminLiquidity);

  const payoutPerWinner = adminAction?.payout_per_winner || 0;
  const winnerCount = adminAction?.winner_count || 0;

  return (
    <div className="bg-gray-800 rounded-lg p-4 mt-4">
      <h3 className="text-lg font-semibold mb-3">Payout Details</h3>

      {noPoolData && !adminAction && (
        <div className="text-sm text-yellow-500 mb-3">
          No detailed payout information is available yet.
        </div>
      )}

      {noPoolData && adminAction && (
        <div className="text-sm text-yellow-500 mb-3">
          Pool data is not available, but payout information exists.
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gray-700 p-3 rounded">
          <div className="text-sm text-gray-400">Total Pool</div>
          <div className="text-lg font-semibold">₦{totalPool.toLocaleString()}</div>
          <div className="text-xs text-gray-500">
            User Pool: ₦{userPool.toLocaleString()}
          </div>
        </div>
        <div className="bg-gray-700 p-3 rounded">
          <div className="text-sm text-gray-400">Admin Liquidity</div>
          <div className="text-lg font-semibold">₦{adminLiquidity.toLocaleString()}</div>
          <div className="text-xs text-gray-500">
            {totalPool > 0 ? `(${((adminLiquidity / totalPool) * 100).toFixed(1)}% of pool)` : '(0%)'}
          </div>
        </div>
        <div className="bg-gray-700 p-3 rounded">
          <div className="text-sm text-gray-400">Platform Fee</div>
          <div className="text-lg font-semibold">₦{platformFee.toLocaleString()}</div>
          <div className="text-xs text-gray-500">
            {totalPool > 0 ? `(${((platformFee / totalPool) * 100).toFixed(1)}%)` : '(0%)'}
          </div>
        </div>
        <div className="bg-gray-700 p-3 rounded">
          <div className="text-sm text-gray-400">Creator Fee</div>
          <div className="text-lg font-semibold">₦{creatorFee.toLocaleString()}</div>
          <div className="text-xs text-gray-500">
            {totalPool > 0 ? `(${((creatorFee / totalPool) * 100).toFixed(1)}%)` : '(0%)'}
          </div>
        </div>
        <div className="bg-gray-700 p-3 rounded col-span-2">
          <div className="text-sm text-gray-400">Payout Per Winner</div>
          <div className="text-lg font-semibold">₦{payoutPerWinner.toLocaleString()}</div>
          {winnerCount > 0 && (
            <div className="text-xs text-gray-500">
              ({winnerCount} winner{winnerCount !== 1 ? 's' : ''})
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SimpleEventPayoutDetails;
