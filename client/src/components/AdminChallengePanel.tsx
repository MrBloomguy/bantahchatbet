import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';

interface Challenge {
  id: string;
  evidence: {
    url: string;
    type: string;
    metadata?: any;
  }[];
  title: string;
  amount: number;
  status: 'started' | 'ended' | 'cancelled' | 'postponed' | 'pending' | 'declined' | 'accepted';
  created_at: string;
  updated_at: string;
  challenger_id: string;
  challenged_id: string;
  winner_id?: string;
  payout_status: 'pending' | 'processing' | 'completed' | 'failed';
  admin_notes?: string;
  end_date?: string;
  cancellation_reason?: string;
  postponement_date?: string;
}

interface AdminChallengePanelProps {
  challenge: Challenge & {
    challenger: {
      name: string;
      avatar_url: string;
      wallet_address?: string;
    };
    challenged: {
      name: string;
      avatar_url: string;
      wallet_address?: string;
    };
  };
}

export const AdminChallengePanel: React.FC<AdminChallengePanelProps> = ({ 
  challenge 
}) => {
  const { currentUser } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [paymentReleased, setPaymentReleased] = useState(false);
  const [allChallenges, setAllChallenges] = useState<Challenge[]>([]);
  const [platformStats, setPlatformStats] = useState({
    totalEventPool: 0,
    totalChallengeLocked: 0,
    platformTotalRevenue: 0,
    totalActiveChallenges: 0,
    totalCompletedChallenges: 0
  });

  const [adminNotes, setAdminNotes] = useState(challenge.admin_notes || '');

  useEffect(() => {
    calculateStats();
    fetchAllChallenges();
    calculatePlatformStats();
  }, [challenge]);

  const fetchAllChallenges = async () => {
    try {
      const { data: challenges, error } = await supabase
        .from('challenges')
        .select(`
          *,
          challenger:challenger_id(name, avatar_url, wallet_address),
          challenged:challenged_id(name, avatar_url, wallet_address)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAllChallenges(challenges || []);
    } catch (error) {
      console.error('Error fetching challenges:', error);
      toast.showError('Failed to fetch challenges');
    }
  };

  const calculatePlatformStats = async () => {
    try {
      const { data: stats, error } = await supabase.rpc('get_platform_stats');
      
      if (error) throw error;
      
      setPlatformStats({
        totalEventPool: stats.total_event_pool || 0,
        totalChallengeLocked: stats.total_challenge_locked || 0,
        platformTotalRevenue: stats.platform_total_revenue || 0,
        totalActiveChallenges: stats.total_active_challenges || 0,
        totalCompletedChallenges: stats.total_completed_challenges || 0
      });
    } catch (error) {
      console.error('Error calculating platform stats:', error);
      toast.showError('Failed to calculate platform statistics');
    }
  };

  const calculateStats = () => {
    const totalPrizePool = challenge.amount * 2; // Both participants' stakes
    const platformFee = totalPrizePool * 0.05; // 5% platform fee
    const winnerPayout = totalPrizePool - platformFee;

    setStats({
      totalPrizePool,
      platformFee,
      winnerPayout,
      paymentStatus: challenge.winner_id ? (paymentReleased ? 'released' : 'pending') : 'awaiting_winner'
    });
  };

  const handleSetWinner = async (winnerId: string) => {
    try {
      setLoading(true);

      const { error } = await supabase.rpc('admin_set_challenge_outcome', {
        p_challenge_id: challenge.id,
        p_winner_id: winnerId,
        p_admin_id: currentUser?.id
      });

      if (error) throw error;

      toast.showSuccess('Winner set successfully');
      calculateStats();
    } catch (error) {
      console.error('Error setting winner:', error);
      toast.showError('Failed to set winner');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus: Challenge['status']) => {
    try {
      setLoading(true);
      const { error } = await supabase.rpc('update_challenge_status', {
        p_challenge_id: challenge.id,
        p_status: newStatus,
        p_admin_id: currentUser?.id,
        p_notes: adminNotes
      });

      if (error) throw error;
      toast.showSuccess('Status updated successfully');
    } catch (error) {
      console.error('Error updating status:', error);
      toast.showError('Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  const handleSettlement = async (participantId: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.rpc('settle_challenge_payout', {
        p_challenge_id: challenge.id,
        p_participant_id: participantId,
        p_admin_id: currentUser?.id
      });

      if (error) throw error;

      toast.showSuccess('Payout settled successfully');
      calculateStats();
    } catch (error) {
      console.error('Error settling payout:', error);
      toast.showError('Failed to settle payout');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: Challenge['status']) => {
    const colors: Record<Challenge['status'], string> = {
      started: 'bg-blue-500/20 text-blue-400',
      ended: 'bg-gray-500/20 text-gray-400',
      cancelled: 'bg-red-500/20 text-red-400',
      postponed: 'bg-yellow-500/20 text-yellow-400',
      pending: 'bg-orange-500/20 text-orange-400',
      declined: 'bg-red-500/20 text-red-400',
      accepted: 'bg-green-500/20 text-green-400',
    };
    return colors[status] || 'bg-gray-500/20 text-gray-400';
  };

  return (
    <div className="w-full space-y-6 p-4">
      {/* Platform Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-800 p-4 rounded-lg">
        <div className="stat-card">
          <h3 className="text-lg font-semibold text-gray-300">Platform Overview</h3>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="stat-item">
              <span className="text-sm text-gray-400">Total Event Pool</span>
              <span className="text-xl font-bold text-green-400">₦{platformStats.totalEventPool?.toLocaleString() ?? '0'}</span>
            </div>
            <div className="stat-item">
              <span className="text-sm text-gray-400">Locked in Challenges</span>
              <span className="text-xl font-bold text-blue-400">₦{platformStats.totalChallengeLocked?.toLocaleString() ?? '0'}</span>
            </div>
            <div className="stat-item">
              <span className="text-sm text-gray-400">Platform Revenue (Total Fee)</span>
              <span className="text-xl font-bold text-purple-400">₦{platformStats.platformTotalRevenue?.toLocaleString() ?? '0'}</span>
            </div>
            <div className="stat-item">
              <span className="text-sm text-gray-400">Active Challenges</span>
              <span className="text-xl font-bold text-yellow-400">{platformStats.totalActiveChallenges ?? 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Challenge List */}
      <div className="bg-gray-800 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-300 mb-4">All Challenges</h3>
        {allChallenges.length === 0 ? (
          <div className="text-gray-400">No challenges found or still loading...</div>
        ) : (
          <div className="space-y-4">
            {allChallenges.map((challenge) => (
              <div key={challenge.id} className="border border-gray-700 p-4 rounded-lg hover:bg-gray-700/50 transition-colors">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-md font-medium text-gray-200">{challenge.title}</h4>
                    <div className="flex items-center space-x-4 mt-2">
                      <span className={`px-2 py-1 rounded text-sm ${getStatusColor(challenge.status)}`}>{challenge.status}</span>
                      <span className="text-gray-400">Amount: ₦{challenge.amount}</span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleSetWinner(challenge.challenger_id)}
                      disabled={challenge.status !== 'ended' || loading}
                      className="btn btn-sm btn-primary"
                    >
                      Set Challenger as Winner
                    </button>
                    <button
                      onClick={() => handleSetWinner(challenge.challenged_id)}
                      disabled={challenge.status !== 'ended' || loading}
                      className="btn btn-sm btn-primary"
                    >
                      Set Challenged as Winner
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-gray-800 rounded-lg p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">Challenge Details</h3>
            <div className="flex items-center space-x-2">
              <span className="font-medium">Status:</span>
              <span className={`px-2 py-1 rounded-full text-sm ${getStatusColor(challenge.status)}`}>
                {challenge.status.toUpperCase()}
              </span>
            </div>
            <div>
              <span className="font-medium">Amount:</span>
              <span className="ml-2">{challenge.amount} BTC</span>
            </div>
            <div>
              <span className="font-medium">Created:</span>
              <span className="ml-2">{new Date(challenge.created_at).toLocaleString()}</span>
            </div>
            {challenge.end_date && (
              <div>
                <span className="font-medium">Ended:</span>
                <span className="ml-2">{new Date(challenge.end_date).toLocaleString()}</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-semibold">Participants</h3>
            <div>
              <span className="font-medium">Challenger:</span>
              <div className="flex items-center space-x-2">
                <img src={challenge.challenger.avatar_url} alt="" className="w-6 h-6 rounded-full" />
                <span>{challenge.challenger.name}</span>
              </div>
              {challenge.challenger.wallet_address && (
                <div className="text-sm text-gray-400 truncate">
                  Wallet: {challenge.challenger.wallet_address}
                </div>
              )}
            </div>
            <div>
              <span className="font-medium">Challenged:</span>
              <div className="flex items-center space-x-2">
                <img src={challenge.challenged.avatar_url} alt="" className="w-6 h-6 rounded-full" />
                <span>{challenge.challenged.name}</span>
              </div>
              {challenge.challenged.wallet_address && (
                <div className="text-sm text-gray-400 truncate">
                  Wallet: {challenge.challenged.wallet_address}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-semibold">Payout Status</h3>
          <div className={`px-2 py-1 rounded-full text-sm inline-block
            ${challenge.payout_status === 'completed' ? 'bg-green-500/20 text-green-400' :
              challenge.payout_status === 'processing' ? 'bg-blue-500/20 text-blue-400' :
              challenge.payout_status === 'failed' ? 'bg-red-500/20 text-red-400' :
              'bg-orange-500/20 text-orange-400'}`}>
            {challenge.payout_status.toUpperCase()}
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-semibold">Admin Actions</h3>
          <textarea
            className="w-full bg-gray-700 rounded-lg p-2"
            placeholder="Add admin notes..."
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            rows={3}
          />
          <div className="flex space-x-2">
            <button
              onClick={() => handleUpdateStatus('accepted')}
              disabled={loading || challenge.status === 'accepted'}
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg disabled:opacity-50"
            >
              Accept
            </button>
            <button
              onClick={() => handleUpdateStatus('declined')}
              disabled={loading || challenge.status === 'declined'}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg disabled:opacity-50"
            >
              Decline
            </button>
            <button
              onClick={() => handleUpdateStatus('postponed')}
              disabled={loading || challenge.status === 'postponed'}
              className="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded-lg disabled:opacity-50"
            >
              Postpone
            </button>
          </div>
        </div>

        {challenge.status === 'ended' && (
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">Settlement</h3>
            <div className="flex space-x-2">
              <button
                onClick={() => handleSettlement(challenge.challenger_id)}
                disabled={loading || challenge.payout_status === 'completed'}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg disabled:opacity-50"
              >
                Pay Challenger
              </button>
              <button
                onClick={() => handleSettlement(challenge.challenged_id)}
                disabled={loading || challenge.payout_status === 'completed'}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg disabled:opacity-50"
              >
                Pay Challenged
              </button>
            </div>
          </div>
        )}

        {challenge.evidence && challenge.evidence.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">Evidence</h3>
            <div className="grid grid-cols-2 gap-4">
              {challenge.evidence.map((item, index) => (
                <div key={index} className="bg-gray-700 rounded-lg p-2">
                  {item.type.startsWith('image/') ? (
                    <img src={item.url} alt="Evidence" className="w-full h-auto rounded" />
                  ) : item.type.startsWith('video/') ? (
                    <video src={item.url} controls className="w-full h-auto rounded" />
                  ) : (
                    <a href={item.url} target="_blank" rel="noopener noreferrer" 
                       className="text-blue-400 hover:text-blue-300">
                      View Evidence {index + 1}
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
