import React, { useState, useEffect } from 'react';
import { Trophy, Filter, Search, Check, X, Clock, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from '../contexts/ToastContext';
import AdminLayout from '../layouts/AdminLayout';
import AdminPageLayout from '../components/AdminPageLayout';
import LoadingSpinner from '../components/LoadingSpinner';
import { format } from 'date-fns';
import ChallengePayoutDetails from '../components/admin/ChallengePayoutDetails';

interface Challenge {
  id: string;
  title: string;
  amount: number;
  game_type: string;
  platform: string;
  status: 'pending' | 'accepted' | 'declined' | 'completed' | 'expired';
  created_at: string;
  expires_at: string;
  completed_at?: string;
  challenger_id: string;
  challenged_id: string;
  winner_id?: string;
  challenger: {
    id: string;
    name: string;
    avatar_url?: string;
  };
  challenged: {
    id: string;
    name: string;
    avatar_url?: string;
  };
}

const AdminChallenges: React.FC = () => {
  const toast = useToast();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchChallenges = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('challenges')
        .select(`
          id,
          title,
          amount,
          game_type,
          platform,
          status,
          created_at,
          expires_at,
          completed_at,
          challenger_id,
          challenged_id,
          winner_id,
          challenger:challenger_id(id, name, avatar_url),
          challenged:challenged_id(id, name, avatar_url)
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      console.log('Fetched challenges:', data);
      setChallenges(data || []);
    } catch (error) {
      console.error('Error fetching challenges:', error);
      toast.showError('Failed to fetch challenges');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallenges();
  }, [statusFilter]);

  const handleSetWinner = async (challengeId: string, winnerId: string) => {
    try {
      setActionLoading(true);

      const { error } = await supabase.rpc('admin_set_challenge_outcome', {
        p_challenge_id: challengeId,
        p_winner_id: winnerId,
        p_admin_id: 'admin' // This should be the actual admin ID in production
      });

      if (error) throw error;

      toast.showSuccess('Winner set successfully');
      fetchChallenges();
      setSelectedChallenge(null);
    } catch (error) {
      console.error('Error setting winner:', error);
      toast.showError('Failed to set winner');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateStatus = async (challengeId: string, newStatus: Challenge['status']) => {
    try {
      setActionLoading(true);

      const { error } = await supabase.rpc('update_challenge_status', {
        p_challenge_id: challengeId,
        p_status: newStatus,
        p_admin_id: 'admin', // This should be the actual admin ID in production
        p_notes: adminNotes
      });

      if (error) throw error;

      toast.showSuccess('Status updated successfully');
      fetchChallenges();
      setSelectedChallenge(null);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.showError('Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteChallenge = async (challengeId: string) => {
    if (!confirm('Are you sure you want to delete this challenge?')) return;

    try {
      setActionLoading(true);

      const { error } = await supabase.rpc('delete_challenge', {
        challenge_id: challengeId
      });

      if (error) throw error;

      toast.showSuccess('Challenge deleted successfully');
      fetchChallenges();
      setSelectedChallenge(null);
    } catch (error) {
      console.error('Error deleting challenge:', error);
      toast.showError('Failed to delete challenge');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredChallenges = challenges.filter(challenge => {
    const searchLower = searchTerm.toLowerCase();
    return (
      challenge.title?.toLowerCase().includes(searchLower) ||
      challenge.game_type?.toLowerCase().includes(searchLower) ||
      challenge.challenger?.name?.toLowerCase().includes(searchLower) ||
      challenge.challenged?.name?.toLowerCase().includes(searchLower)
    );
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/10 text-yellow-500';
      case 'accepted': return 'bg-blue-500/10 text-blue-500';
      case 'completed': return 'bg-green-500/10 text-green-500';
      case 'declined': return 'bg-red-500/10 text-red-500';
      case 'expired': return 'bg-gray-500/10 text-gray-500';
      default: return 'bg-gray-500/10 text-gray-500';
    }
  };

  return (
    <AdminLayout>
      <AdminPageLayout
        title={
          <>
            <Trophy className="w-6 h-6 text-[#CCFF00]" />
            Challenges Management
          </>
        }
        actions={
          <>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-4 h-4" />
              <input
                type="text"
                placeholder="Search challenges..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-[#242538] text-white rounded-lg border border-[#333] focus:outline-none focus:border-[#CCFF00] w-full"
              />
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-4 h-4" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-10 pr-4 py-2 bg-[#242538] text-white rounded-lg border border-[#333] focus:outline-none focus:border-[#CCFF00] appearance-none w-full"
                aria-label="Filter challenges by status"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="accepted">Accepted</option>
                <option value="completed">Completed</option>
                <option value="declined">Declined</option>
                <option value="expired">Expired</option>
              </select>
            </div>
          </>
        }
      >

        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : filteredChallenges.length === 0 ? (
          <div className="bg-[#242538] rounded-xl p-8 text-center">
            <Trophy className="w-12 h-12 text-white/20 mx-auto mb-3" />
            <p className="text-white/60 text-lg">No challenges found</p>
            <p className="text-white/40 mt-2">Try adjusting your filters or search terms</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block bg-[#242538] rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#1a1b2e]">
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Game</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Challenger</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Challenged</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Created</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-white/60 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#333]">
                  {filteredChallenges.map((challenge) => (
                    <tr key={challenge.id} className="hover:bg-[#1a1b2e]/50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        {challenge.title || 'Untitled Challenge'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        {challenge.game_type} ({challenge.platform})
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        ₦{challenge.amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        <div className="flex items-center">
                          <img
                            src={challenge.challenger?.avatar_url || '/avatar.svg'}
                            alt={challenge.challenger?.name}
                            className="w-6 h-6 rounded-full mr-2"
                          />
                          {challenge.challenger?.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        <div className="flex items-center">
                          <img
                            src={challenge.challenged?.avatar_url || '/avatar.svg'}
                            alt={challenge.challenged?.name}
                            className="w-6 h-6 rounded-full mr-2"
                          />
                          {challenge.challenged?.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded text-xs ${getStatusColor(challenge.status)}`}>
                          {challenge.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white/60">
                        {format(new Date(challenge.created_at), 'MMM d, yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          type="button"
                          onClick={() => setSelectedChallenge(challenge)}
                          className="text-[#CCFF00] hover:text-[#CCFF00]/80"
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {filteredChallenges.map((challenge) => (
              <div
                key={challenge.id}
                className="bg-[#242538] rounded-xl p-4 space-y-4"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-white font-medium">{challenge.title || 'Untitled Challenge'}</h3>
                    <div className="flex items-center mt-1 text-sm text-white/60">
                      <span>{challenge.game_type}</span>
                      <span className="mx-1">•</span>
                      <span>{challenge.platform}</span>
                    </div>
                  </div>
                  <span className="text-[#CCFF00] font-medium">₦{challenge.amount.toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <img
                      src={challenge.challenger?.avatar_url || '/avatar.svg'}
                      alt={challenge.challenger?.name}
                      className="w-6 h-6 rounded-full"
                    />
                    <span className="text-sm text-white">{challenge.challenger?.name}</span>
                  </div>
                  <span className="text-xs text-white/40">vs</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-white">{challenge.challenged?.name}</span>
                    <img
                      src={challenge.challenged?.avatar_url || '/avatar.svg'}
                      alt={challenge.challenged?.name}
                      className="w-6 h-6 rounded-full"
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-[#333]">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs ${getStatusColor(challenge.status)}`}>
                      {challenge.status}
                    </span>
                    <span className="text-xs text-white/60">{format(new Date(challenge.created_at), 'MMM d, yyyy')}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedChallenge(challenge)}
                    className="px-3 py-1.5 text-sm bg-[#CCFF00]/10 text-[#CCFF00] rounded-lg hover:bg-[#CCFF00]/20"
                  >
                    Manage
                  </button>
                </div>
              </div>
            ))}
          </div>
          </>
        )}
      </AdminPageLayout>

      {/* Challenge Detail Modal */}
      {selectedChallenge && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#242538] rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[#333]">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">
                  {selectedChallenge.title || 'Untitled Challenge'}
                </h2>
                <button
                  type="button"
                  onClick={() => setSelectedChallenge(null)}
                  className="text-white/60 hover:text-white"
                  aria-label="Close details"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-white/60 text-sm">Game</p>
                    <p className="text-white font-medium">{selectedChallenge.game_type} ({selectedChallenge.platform})</p>
                  </div>

                  <div>
                    <p className="text-white/60 text-sm">Amount</p>
                    <p className="text-white font-medium">₦{selectedChallenge.amount.toLocaleString()}</p>
                  </div>

                  <div>
                    <p className="text-white/60 text-sm">Status</p>
                    <p className={`inline-block px-2 py-1 rounded text-sm ${getStatusColor(selectedChallenge.status)}`}>
                      {selectedChallenge.status}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-white/60 text-sm">Created</p>
                    <p className="text-white">{format(new Date(selectedChallenge.created_at), 'MMM d, yyyy h:mm a')}</p>
                  </div>

                  <div>
                    <p className="text-white/60 text-sm">Expires</p>
                    <p className="text-white">{format(new Date(selectedChallenge.expires_at), 'MMM d, yyyy h:mm a')}</p>
                  </div>

                  {selectedChallenge.completed_at && (
                    <div>
                      <p className="text-white/60 text-sm">Completed</p>
                      <p className="text-white">{format(new Date(selectedChallenge.completed_at), 'MMM d, yyyy h:mm a')}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-[#333] pt-6 space-y-4">
                <h3 className="text-lg font-medium text-white">Participants</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-[#1a1b2e] p-4 rounded-lg">
                    <div className="flex items-center gap-3">
                      <img
                        src={selectedChallenge.challenger?.avatar_url || '/avatar.svg'}
                        alt={selectedChallenge.challenger?.name}
                        className="w-10 h-10 rounded-full"
                      />
                      <div>
                        <p className="text-white font-medium">{selectedChallenge.challenger?.name}</p>
                        <p className="text-white/60 text-sm">Challenger</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#1a1b2e] p-4 rounded-lg">
                    <div className="flex items-center gap-3">
                      <img
                        src={selectedChallenge.challenged?.avatar_url || '/avatar.svg'}
                        alt={selectedChallenge.challenged?.name}
                        className="w-10 h-10 rounded-full"
                      />
                      <div>
                        <p className="text-white font-medium">{selectedChallenge.challenged?.name}</p>
                        <p className="text-white/60 text-sm">Challenged</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {selectedChallenge.status === 'completed' && (
                <div className="border-t border-[#333] pt-6 space-y-4">
                  <h3 className="text-lg font-medium text-white">Payout Details</h3>
                  <ChallengePayoutDetails challengeId={selectedChallenge.id} />
                </div>
              )}

              {selectedChallenge.status === 'accepted' && (
                <div className="border-t border-[#333] pt-6 space-y-4">
                  <h3 className="text-lg font-medium text-white">Set Winner</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => handleSetWinner(selectedChallenge.id, selectedChallenge.challenger_id)}
                      disabled={actionLoading}
                      className="bg-[#1a1b2e] p-4 rounded-lg hover:bg-[#1a1b2e]/80 transition-colors flex items-center gap-3"
                    >
                      <img
                        src={selectedChallenge.challenger?.avatar_url || '/avatar.svg'}
                        alt={selectedChallenge.challenger?.name}
                        className="w-10 h-10 rounded-full"
                      />
                      <div className="text-left">
                        <p className="text-white font-medium">{selectedChallenge.challenger?.name}</p>
                        <p className="text-white/60 text-sm">Set as Winner</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSetWinner(selectedChallenge.id, selectedChallenge.challenged_id)}
                      disabled={actionLoading}
                      className="bg-[#1a1b2e] p-4 rounded-lg hover:bg-[#1a1b2e]/80 transition-colors flex items-center gap-3"
                    >
                      <img
                        src={selectedChallenge.challenged?.avatar_url || '/avatar.svg'}
                        alt={selectedChallenge.challenged?.name}
                        className="w-10 h-10 rounded-full"
                      />
                      <div className="text-left">
                        <p className="text-white font-medium">{selectedChallenge.challenged?.name}</p>
                        <p className="text-white/60 text-sm">Set as Winner</p>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              <div className="border-t border-[#333] pt-6 space-y-4">
                <h3 className="text-lg font-medium text-white">Admin Actions</h3>

                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add admin notes..."
                  className="w-full bg-[#1a1b2e] text-white rounded-lg p-3 border border-[#333] focus:outline-none focus:border-[#CCFF00]"
                  rows={3}
                />

                <div className="flex flex-wrap gap-3">
                  {selectedChallenge.status !== 'accepted' && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(selectedChallenge.id, 'accepted')}
                      disabled={actionLoading}
                      className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 flex items-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      Accept
                    </button>
                  )}

                  {selectedChallenge.status !== 'declined' && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(selectedChallenge.id, 'declined')}
                      disabled={actionLoading}
                      className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 flex items-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Decline
                    </button>
                  )}

                  {selectedChallenge.status !== 'expired' && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(selectedChallenge.id, 'expired')}
                      disabled={actionLoading}
                      className="px-4 py-2 bg-gray-500/20 text-gray-400 rounded-lg hover:bg-gray-500/30 flex items-center gap-2"
                    >
                      <Clock className="w-4 h-4" />
                      Mark Expired
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDeleteChallenge(selectedChallenge.id)}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 flex items-center gap-2 ml-auto"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminChallenges;
