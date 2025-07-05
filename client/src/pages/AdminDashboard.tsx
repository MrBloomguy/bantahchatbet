import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Trophy,
  Wallet,
  Check,
  Calendar,
  Users,
  MessageSquare
} from 'lucide-react';
import { useAdmin, AdminStats } from '../hooks/useAdmin';
import { useToast } from '../contexts/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';
import AdminLayout from '../layouts/AdminLayout';
import { AdminChallengeStats } from '../components/AdminChallengeStats';
import { format } from 'date-fns';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { getStats } = useAdmin();
  const toast = useToast();

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'challenges'>('overview');

  const loadStats = async () => {
    try {
      const data = await getStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
      toast.showError('Failed to load admin stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1b2e] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto p-4 lg:p-8 space-y-8">
        {/* Tab Navigation */}
        <div className="flex gap-4 border-b border-white/10">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-2 px-1 font-medium transition-colors ${
              activeTab === 'overview'
                ? 'text-[#CCFF00] border-b-2 border-[#CCFF00]'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('challenges')}
            className={`pb-2 px-1 font-medium transition-colors ${
              activeTab === 'challenges'
                ? 'text-[#CCFF00] border-b-2 border-[#CCFF00]'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Challenges
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' ? (
          <>
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-[#242538] rounded-xl p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-[#CCFF00]/20 rounded-lg">
                    <Trophy className="w-6 h-6 text-[#CCFF00]" />
                  </div>
                  <div>
                    <p className="text-white/60 text-sm">Total Events</p>
                    <p className="text-2xl font-bold text-white">{stats?.totalEvents || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-[#242538] rounded-xl p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-[#CCFF00]/20 rounded-lg">
                    <Users className="w-6 h-6 text-[#CCFF00]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white/60 text-sm">Active Users</p>
                    <div className="space-y-1 mt-1">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-white/40">24h</span>
                        <span className="text-sm font-medium text-white">{stats?.activeUsers?.last24h || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-white/40">7d</span>
                        <span className="text-sm font-medium text-white">{stats?.activeUsers?.lastWeek || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-white/40">30d</span>
                        <span className="text-sm font-medium text-white">{stats?.activeUsers?.lastMonth || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[#242538] rounded-xl p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-[#CCFF00]/20 rounded-lg">
                    <Wallet className="w-6 h-6 text-[#CCFF00]" />
                  </div>
                  <div>
                    <p className="text-white/60 text-sm">Total Users</p>
                    <p className="text-2xl font-bold text-white">{stats?.totalUsers || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-[#242538] rounded-xl p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-[#CCFF00]/20 rounded-lg">
                    <MessageSquare className="w-6 h-6 text-[#CCFF00]" />
                  </div>
                  <div>
                    <p className="text-white/60 text-sm">Active Groups</p>
                    <p className="text-2xl font-bold text-white">{stats?.totalGroups || 0}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Events List */}
            <div className="bg-[#242538] rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">Active Events</h2>
              <div className="space-y-4">
                {stats?.events?.map((event: any) => (
                  <div 
                    key={event.id}
                    className="bg-[#1a1b2e] rounded-lg p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-[#CCFF00]/10 rounded-lg">
                        <Calendar className="w-5 h-5 text-[#CCFF00]" />
                      </div>
                      <div>
                        <h3 className="text-white font-medium">{event.title}</h3>
                        <div className="flex items-center gap-4 mt-1">
                          <p className="text-white/60 text-sm">
                            By @{event.creator?.username}
                          </p>
                          <p className="text-white/60 text-sm">
                            {format(new Date(event.start_time), "MMM d, yyyy 'at' h:mm a")}
                          </p>
                          <p className="text-white/60 text-sm">
                            {event.participants_count} participants
                          </p>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate(`/events/${event.id}`)}
                      className="px-4 py-2 bg-[#CCFF00]/10 text-[#CCFF00] rounded-lg hover:bg-[#CCFF00]/20 transition-colors"
                    >
                      View
                    </button>
                  </div>
                ))}

                {(!stats?.events || stats.events.length === 0) && (
                  <div className="text-center py-8 text-white/60">
                    No active events
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-[#242538] rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <button
                  onClick={() => navigate('/admin/reports')}
                  className="flex items-center gap-3 p-4 bg-[#1a1b2e] rounded-lg hover:bg-[#1a1b2e]/80 transition-colors"
                >
                  <Check className="w-5 h-5 text-[#CCFF00]" />
                  <span className="text-white">Manage Reports</span>
                </button>

                <button
                  onClick={() => navigate('/admin/withdrawals')}
                  className="flex items-center gap-3 p-4 bg-[#1a1b2e] rounded-lg hover:bg-[#1a1b2e]/80 transition-colors"
                >
                  <Wallet className="w-5 h-5 text-[#CCFF00]" />
                  <span className="text-white">Process Withdrawals</span>
                </button>

                <button
                  onClick={() => navigate('/admin/audit-log')}
                  className="flex items-center gap-3 p-4 bg-[#1a1b2e] rounded-lg hover:bg-[#1a1b2e]/80 transition-colors"
                >
                  <LayoutDashboard className="w-5 h-5 text-[#CCFF00]" />
                  <span className="text-white">View Audit Log</span>
                </button>
              </div>
            </div>
          </>
        ) : (
          <AdminChallengeStats />
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
