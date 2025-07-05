import React, { useState, useEffect } from 'react';
import { useAdmin } from '../../hooks/useAdmin';
import AddEventLiquidity from './AddEventLiquidity';
import LiquidityHistory from './LiquidityHistory';
import LoadingSpinner from '../LoadingSpinner';

interface EventLiquidityManagerProps {
  eventId: string;
}

const EventLiquidityManager: React.FC<EventLiquidityManagerProps> = ({ eventId }) => {
  const [currentLiquidity, setCurrentLiquidity] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const { getEventLiquidity, addEventLiquidity, admin } = useAdmin();

  const loadLiquidityData = async () => {
    try {
      setLoading(true);
      const data = await getEventLiquidity(eventId);
      setCurrentLiquidity(data.currentLiquidity);
    } catch (error) {
      console.error('Error loading liquidity data:', error);
      // If there's an error, we'll just show 0 as the current liquidity
      // This could happen if the admin_liquidity column hasn't been added yet
      // or if the database schema is still being updated
      setCurrentLiquidity(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (eventId) {
      loadLiquidityData();
    }
  }, [eventId, getEventLiquidity]); // Add getEventLiquidity as a dependency

  const handleLiquidityAdded = async () => {
    await loadLiquidityData();

    // Instead of reloading the page, we'll rely on the real-time subscription
    // in the useEvent hook to update the UI

    // Manually trigger an update to the event_pools table to ensure the subscription fires
    try {
      // This is just a dummy update to trigger the subscription
      const { data: poolData } = await supabase
        .from('event_pools')
        .select('*')
        .eq('event_id', eventId)
        .limit(1);

      if (poolData && poolData.length > 0) {
        const pool = poolData[0];

        // Update the updated_at timestamp to trigger the subscription
        await supabase
          .from('event_pools')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', pool.id);
      }
    } catch (error) {
      console.warn('Error triggering event pool update:', error);
      // This is just a helper, so we don't need to handle errors
    }
  };

  if (loading) {
    return (
      <div className="p-4 flex justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="bg-white rounded-lg shadow-sm p-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1">
            <AddEventLiquidity
              eventId={eventId}
              adminEmail={admin?.email || ''}
              currentLiquidity={currentLiquidity}
              onSuccess={handleLiquidityAdded}
            />
          </div>

          <div className="flex-1 bg-gray-50 rounded p-2 text-xs">
            <p className="text-gray-600 mb-1">
              Adding liquidity increases the event pool amount visible to users, making events more attractive.
              This liquidity remains in the pool even as users place wagers.
            </p>
            <p className="text-gray-600">
              When the event completes, this liquidity will be distributed to winners along with user wagers.
            </p>
          </div>
        </div>
      </div>

      <LiquidityHistory eventId={eventId} />
    </div>
  );
};

export default EventLiquidityManager;
