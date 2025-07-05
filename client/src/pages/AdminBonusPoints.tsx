import React, { useState, useEffect } from 'react';
import { Search, Award, Users, Gift, Zap } from 'lucide-react';
import AdminLayout from '../layouts/AdminLayout';
import AdminPageLayout from '../components/AdminPageLayout';
import { supabase } from '../lib/supabase';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

interface User {
  id: string;
  name: string;
  username: string;
  avatar_url: string;
  reputation_score?: number;
}

const AdminBonusPoints: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [points, setPoints] = useState<number>(100);
  const [reason, setReason] = useState<string>('Admin bonus');
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [recentAwards, setRecentAwards] = useState<any[]>([]);
  const toast = useToast();
  const { refreshUser } = useAuth();

  // Predefined bonus options
  const bonusOptions = [
    { points: 100, label: 'Small Bonus', icon: <Gift className="w-4 h-4" /> },
    { points: 500, label: 'Medium Bonus', icon: <Award className="w-4 h-4" /> },
    { points: 1000, label: 'Large Bonus', icon: <Zap className="w-4 h-4" /> },
  ];

  // Load recent point awards
  useEffect(() => {
    loadRecentAwards();
  }, []);

  const loadRecentAwards = async () => {
    try {
      setLoading(true);

      // Log for debugging
      console.log('Loading recent awards...');

      // First, try without the action_type filter to see if there are any transactions at all
      const { data: allData, error: allError } = await supabase
        .from('point_transactions')
        .select(`
          id,
          user_id,
          points,
          action_type,
          description,
          created_at
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      // If we have transactions, fetch the user details separately
      if (allData && allData.length > 0) {
        // Get unique user IDs
        const userIds = [...new Set(allData.map(item => item.user_id))];

        // Fetch user details
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id, name, username, avatar_url')
          .in('id', userIds);

        if (!userError && userData) {
          // Create a map of user details by ID
          const userMap = userData.reduce((acc, user) => {
            acc[user.id] = user;
            return acc;
          }, {});

          // Add user details to transactions
          allData.forEach(transaction => {
            transaction.user = userMap[transaction.user_id] || null;
          });
        }
      }

      if (allError) {
        console.error('Error fetching all point transactions:', allError);
        toast.showError('Error loading transactions: ' + allError.message);
        setRecentAwards([]);
        return;
      }

      // Log all transactions for debugging
      console.log('All transactions:', allData);

      // Now try with the filter
      const { data, error } = await supabase
        .from('point_transactions')
        .select(`
          id,
          user_id,
          points,
          action_type,
          description,
          created_at
        `)
        .eq('action_type', 'admin_bonus')
        .order('created_at', { ascending: false })
        .limit(10);

      // If we have filtered transactions, fetch the user details
      if (!error && data && data.length > 0) {
        // Get unique user IDs
        const userIds = [...new Set(data.map(item => item.user_id))];

        // Fetch user details
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id, name, username, avatar_url')
          .in('id', userIds);

        if (!userError && userData) {
          // Create a map of user details by ID
          const userMap = userData.reduce((acc, user) => {
            acc[user.id] = user;
            return acc;
          }, {});

          // Add user details to transactions
          data.forEach(transaction => {
            transaction.user = userMap[transaction.user_id] || null;
          });
        }
      }

      if (error) {
        console.error('Error fetching admin bonus transactions:', error);
        toast.showError('Error loading admin bonus transactions: ' + error.message);

        // If we have all transactions but filtering failed, just show all of them
        if (allData && allData.length > 0) {
          setRecentAwards(allData);
          return;
        }

        setRecentAwards([]);
        return;
      }

      // If we have filtered data, use it
      if (data && data.length > 0) {
        console.log('Found admin bonus transactions:', data.length);
        setRecentAwards(data);
      }
      // Otherwise, if we have any transactions at all, show those
      else if (allData && allData.length > 0) {
        console.log('No admin bonus transactions found, showing all transactions');
        setRecentAwards(allData);
      }
      // If no transactions at all, show empty state
      else {
        console.log('No transactions found');
        setRecentAwards([]);
      }
    } catch (error) {
      console.error('Error loading recent awards:', error);
      toast.showError('Failed to load recent awards');
      setRecentAwards([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      setSearching(true);
      const { data, error } = await supabase
        .from('users')
        .select('id, name, username, avatar_url, reputation_score')
        .or(`name.ilike.%${searchQuery}%,username.ilike.%${searchQuery}%`)
        .limit(10);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching users:', error);
      toast.showError('Failed to search users');
    } finally {
      setSearching(false);
    }
  };

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    setSearchResults([]);
  };

  const handlePointsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0) {
      setPoints(value);
    }
  };

  const handleBonusOptionSelect = (points: number) => {
    setPoints(points);
  };

  const handleAwardPoints = async () => {
    if (!selectedUser) {
      toast.showError('Please select a user');
      return;
    }

    if (points <= 0) {
      toast.showError('Points must be greater than 0');
      return;
    }

    try {
      setLoading(true);

      // Call the award_points function
      console.log('Calling award_points with params:', {
        p_user_id: selectedUser.id,
        p_points: points,
        p_action_type: 'admin_bonus',
        p_description: reason || 'Admin bonus points',
        p_metadata: { awarded_by: 'admin', reason }
      });

      const { error } = await supabase.rpc('award_points', {
        p_user_id: selectedUser.id,
        p_points: points,
        p_action_type: 'admin_bonus',
        p_description: reason || 'Admin bonus points',
        p_metadata: { awarded_by: 'admin', reason }
      });

      if (error) {
        console.error('Error from RPC call:', error);

        // Check for specific error types
        if (error.message.includes('function award_points() does not exist')) {
          toast.showError('The award_points function is not available. Please run the database migration first.');
        } else if (error.message.includes('permission denied')) {
          toast.showError('You do not have permission to award points. Admin privileges required.');
        } else {
          toast.showError(`Failed to award points: ${error.message}`);
        }

        throw error;
      }

      // Fetch updated user data to confirm points were added
      const { data: updatedUser, error: userError } = await supabase
        .from('users')
        .select('id, name, username, avatar_url, reputation_score')
        .eq('id', selectedUser.id)
        .single();

      if (userError) {
        console.error('Error fetching updated user data:', userError);
        toast.showSuccess(`Successfully awarded ${points} points to ${selectedUser.name}`);
      } else if (updatedUser) {
        const oldPoints = selectedUser.reputation_score || 0;
        const newPoints = updatedUser.reputation_score || 0;
        const pointsAdded = newPoints - oldPoints;

        // Log the points change for debugging
        console.log('Points change:', {
          userId: selectedUser.id,
          oldPoints,
          newPoints,
          pointsAdded,
          awardedPoints: points
        });

        toast.showSuccess(
          `Successfully awarded ${points} points to ${selectedUser.name}. ` +
          `Their points increased from ${oldPoints} to ${newPoints} (${pointsAdded > 0 ? '+' + pointsAdded : pointsAdded}).`
        );
      } else {
        toast.showSuccess(`Successfully awarded ${points} points to ${selectedUser.name}`);
      }

      // Reset form
      setSelectedUser(null);
      setPoints(100);
      setReason('Admin bonus');
      setSearchQuery('');

      // Refresh recent awards and user data
      loadRecentAwards();

      // Refresh the current user data to update points in the UI
      await refreshUser();
    } catch (error) {
      console.error('Error awarding points:', error);
      // Error message already shown above
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <AdminLayout>
      <AdminPageLayout
        title="Bonus Points"
        icon={<Award className="w-6 h-6" />}
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Award Points Form */}
          <div className="lg:col-span-2 bg-[#242538] rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Award Bonus Points</h2>

            {/* User Search */}
            <div className="mb-6">
              <label className="block text-white/80 mb-2">Select User</label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or username"
                  className="w-full bg-[#1a1b2e] text-white px-4 py-3 rounded-lg pl-10 focus:outline-none focus:ring-2 focus:ring-[#CCFF00]/50"
                />
                <Search className="absolute left-3 top-3.5 text-white/60 w-4 h-4" />
                <button
                  type="button"
                  onClick={handleSearch}
                  disabled={searching}
                  className="absolute right-3 top-2 px-3 py-1.5 bg-[#CCFF00]/10 text-[#CCFF00] rounded-lg hover:bg-[#CCFF00]/20 transition-colors"
                >
                  {searching ? 'Searching...' : 'Search'}
                </button>
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="mt-2 bg-[#1a1b2e] rounded-lg max-h-60 overflow-y-auto">
                  {searchResults.map(user => (
                    <div
                      key={user.id}
                      onClick={() => handleUserSelect(user)}
                      className="flex items-center gap-3 p-3 hover:bg-[#2a2b42] cursor-pointer transition-colors"
                    >
                      <img
                        src={user.avatar_url || '/avatar.svg'}
                        alt={user.name}
                        className="w-10 h-10 rounded-full"
                      />
                      <div>
                        <p className="text-white font-medium">{user.name}</p>
                        <p className="text-white/60 text-sm">@{user.username}</p>
                      </div>
                      <div className="ml-auto text-white/80">
                        <span className="flex items-center gap-1">
                          <Award className="w-4 h-4 text-[#CCFF00]" />
                          {user.reputation_score || 0} points
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Selected User */}
              {selectedUser && (
                <div className="mt-4 bg-[#1a1b2e] p-4 rounded-lg flex items-center gap-3">
                  <img
                    src={selectedUser.avatar_url || '/avatar.svg'}
                    alt={selectedUser.name}
                    className="w-12 h-12 rounded-full"
                  />
                  <div>
                    <p className="text-white font-medium">{selectedUser.name}</p>
                    <p className="text-white/60 text-sm">@{selectedUser.username}</p>
                  </div>
                  <div className="ml-auto text-white/80">
                    <span className="flex items-center gap-1">
                      <Award className="w-4 h-4 text-[#CCFF00]" />
                      {selectedUser.reputation_score || 0} points
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedUser(null)}
                    className="text-white/60 hover:text-white"
                  >
                    &times;
                  </button>
                </div>
              )}
            </div>

            {/* Points Input */}
            <div className="mb-6">
              <label className="block text-white/80 mb-2">Points to Award</label>
              <input
                type="number"
                value={points}
                onChange={handlePointsChange}
                min="1"
                aria-label="Points to Award"
                placeholder="Enter points amount"
                className="w-full bg-[#1a1b2e] text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CCFF00]/50"
              />

              {/* Quick Select Buttons */}
              <div className="flex flex-wrap gap-2 mt-2">
                {bonusOptions.map(option => (
                  <button
                    key={option.points}
                    type="button"
                    onClick={() => handleBonusOptionSelect(option.points)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
                      points === option.points
                        ? 'bg-[#CCFF00] text-black'
                        : 'bg-[#1a1b2e] text-white hover:bg-[#2a2b42]'
                    }`}
                  >
                    {option.icon}
                    {option.label} ({option.points})
                  </button>
                ))}
              </div>
            </div>

            {/* Reason Input */}
            <div className="mb-6">
              <label className="block text-white/80 mb-2">Reason (Optional)</label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Why are you awarding these points?"
                className="w-full bg-[#1a1b2e] text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CCFF00]/50"
              />
            </div>

            {/* Submit Button */}
            <button
              type="button"
              onClick={handleAwardPoints}
              disabled={!selectedUser || loading}
              className="w-full bg-[#CCFF00] text-black font-medium py-3 rounded-lg hover:bg-[#CCFF00]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Awarding Points...' : 'Award Points'}
            </button>
          </div>

          {/* Recent Awards */}
          <div className="bg-[#242538] rounded-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Recent Awards</h2>
              <button
                type="button"
                onClick={loadRecentAwards}
                className="text-[#CCFF00] text-sm hover:underline flex items-center gap-1"
                disabled={loading}
              >
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : recentAwards.length > 0 ? (
              <div className="space-y-4">
                {recentAwards.map(award => (
                  <div key={award.id} className="bg-[#1a1b2e] p-3 rounded-lg">
                    <div className="flex items-center gap-3">
                      <img
                        src={award.user?.avatar_url || '/avatar.svg'}
                        alt={award.user?.name || 'User'}
                        className="w-8 h-8 rounded-full"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">{award.user?.name || 'Unknown User'}</p>
                        <p className="text-white/60 text-xs">@{award.user?.username || award.user_id.substring(0, 8)}</p>
                      </div>
                      <div className="text-[#CCFF00] font-bold">
                        +{award.points}
                      </div>
                    </div>
                    <div className="mt-2">
                      <div className="flex justify-between">
                        <p className="text-white/80 text-sm">{award.description || 'No description'}</p>
                        <p className="text-white/60 text-xs bg-[#242538] px-2 py-1 rounded">{award.action_type}</p>
                      </div>
                      <p className="text-white/60 text-xs mt-1">{formatDate(award.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-white/60">
                <p>No recent awards found</p>
                <button
                  type="button"
                  onClick={loadRecentAwards}
                  className="mt-2 text-[#CCFF00] text-sm hover:underline"
                >
                  Try refreshing
                </button>
              </div>
            )}
          </div>
        </div>
      </AdminPageLayout>
    </AdminLayout>
  );
};

export default AdminBonusPoints;
