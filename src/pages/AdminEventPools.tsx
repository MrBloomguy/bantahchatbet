import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Trophy, Filter, Search, ArrowUpDown, DollarSign, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from '../contexts/ToastContext';
import AdminLayout from '../layouts/AdminLayout';
import AdminPageLayout from '../components/AdminPageLayout';
import LoadingSpinner from '../components/LoadingSpinner';
import { format } from 'date-fns';

interface EventPool {
  id: string;
  event_id: string;
  total_amount: number;
  platform_fee: number;
  creator_fee: number;
  admin_liquidity: number;
  yes_pool: number;
  no_pool: number;
  entry_amount: number;
  status: string;
  created_at: string;
  updated_at: string;
  event: {
    id: string;
    title: string;
    status: string;
    start_time: string;
    end_time: string;
    creator: {
      id: string;
      name: string;
      username: string;
    };
  };
}

interface EventPoolStats {
  totalPools: number;
  totalLiquidity: number;
  totalPlatformFees: number;
  totalCreatorFees: number;
  totalUserWagers: number;
  activeEvents: number;
  completedEvents: number;
  averagePoolSize: number;
  monthlyData: {
    month: string;
    totalAmount: number;
    platformFees: number;
  }[];
  poolDistribution: {
    name: string;
    value: number;
  }[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const AdminEventPools: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [eventPools, setEventPools] = useState<EventPool[]>([]);
  const [filteredPools, setFilteredPools] = useState<EventPool[]>([]);
  const [stats, setStats] = useState<EventPoolStats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'updated_at',
    direction: 'desc'
  });
  const toast = useToast();

  useEffect(() => {
    fetchEventPools();
  }, []);

  useEffect(() => {
    if (eventPools.length > 0) {
      calculateStats();
      applyFilters();
    }
  }, [eventPools, searchQuery, statusFilter, sortConfig]);

  const fetchEventPools = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('event_pools')
        .select(`
          *,
          event:event_id (
            id,
            title,
            status,
            start_time,
            end_time,
            creator:creator_id (
              id,
              name,
              username
            )
          )
        `)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      setEventPools(data || []);
      setFilteredPools(data || []);
    } catch (error) {
      console.error('Error fetching event pools:', error);
      toast.showError('Failed to load event pools');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    if (!eventPools.length) return;

    const totalPools = eventPools.length;
    const totalLiquidity = eventPools.reduce((sum, pool) => sum + (pool.admin_liquidity || 0), 0);
    const totalPlatformFees = eventPools.reduce((sum, pool) => sum + (pool.platform_fee || 0), 0);
    const totalCreatorFees = eventPools.reduce((sum, pool) => sum + (pool.creator_fee || 0), 0);

    // Calculate total user wagers (total amount minus admin liquidity)
    const totalUserWagers = eventPools.reduce(
      (sum, pool) => sum + (pool.total_amount || 0) - (pool.admin_liquidity || 0),
      0
    );

    const activeEvents = eventPools.filter(pool =>
      pool.event && pool.event.status !== 'completed' && pool.event.status !== 'cancelled'
    ).length;

    const completedEvents = eventPools.filter(pool =>
      pool.event && pool.event.status === 'completed'
    ).length;

    const averagePoolSize = totalPools > 0 ? totalUserWagers / totalPools : 0;

    // Generate monthly data for the chart
    const monthlyData: { [key: string]: { totalAmount: number; platformFees: number } } = {};

    eventPools.forEach(pool => {
      const date = new Date(pool.created_at);
      const monthYear = format(date, 'MMM yyyy');

      if (!monthlyData[monthYear]) {
        monthlyData[monthYear] = { totalAmount: 0, platformFees: 0 };
      }

      monthlyData[monthYear].totalAmount += pool.total_amount || 0;
      monthlyData[monthYear].platformFees += pool.platform_fee || 0;
    });

    const monthlyChartData = Object.entries(monthlyData).map(([month, data]) => ({
      month,
      totalAmount: data.totalAmount,
      platformFees: data.platformFees
    }));

    // Calculate pool distribution for pie chart
    const poolDistribution = [
      { name: 'User Wagers', value: totalUserWagers },
      { name: 'Admin Liquidity', value: totalLiquidity },
      { name: 'Platform Fees', value: totalPlatformFees },
      { name: 'Creator Fees', value: totalCreatorFees }
    ];

    setStats({
      totalPools,
      totalLiquidity,
      totalPlatformFees,
      totalCreatorFees,
      totalUserWagers,
      activeEvents,
      completedEvents,
      averagePoolSize,
      monthlyData: monthlyChartData,
      poolDistribution
    });
  };

  const applyFilters = () => {
    let result = [...eventPools];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(pool =>
        pool.event &&
        (pool.event.title.toLowerCase().includes(query) ||
         pool.event.creator.name.toLowerCase().includes(query) ||
         pool.event.creator.username.toLowerCase().includes(query))
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(pool => pool.event && pool.event.status === statusFilter);
    }

    // Apply sorting
    result.sort((a, b) => {
      let aValue, bValue;

      switch (sortConfig.key) {
        case 'title':
          aValue = a.event?.title || '';
          bValue = b.event?.title || '';
          break;
        case 'total_amount':
          aValue = a.total_amount || 0;
          bValue = b.total_amount || 0;
          break;
        case 'admin_liquidity':
          aValue = a.admin_liquidity || 0;
          bValue = b.admin_liquidity || 0;
          break;
        case 'platform_fee':
          aValue = a.platform_fee || 0;
          bValue = b.platform_fee || 0;
          break;
        case 'creator_fee':
          aValue = a.creator_fee || 0;
          bValue = b.creator_fee || 0;
          break;
        case 'status':
          aValue = a.event?.status || '';
          bValue = b.event?.status || '';
          break;
        case 'updated_at':
        default:
          aValue = new Date(a.updated_at).getTime();
          bValue = new Date(b.updated_at).getTime();
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });

    setFilteredPools(result);
  };

  const handleSort = (key: string) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString()}`;
  };

  const formatCompactNumber = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
  };

  return (
    <AdminLayout>
      <AdminPageLayout title="Event Pools" icon={<Trophy className="w-5 h-5" />}>
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Stats Cards */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#242538] rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-white/70 text-sm">Total Event Pools</h3>
                    <Trophy className="w-5 h-5 text-[#CCFF00]" />
                  </div>
                  <p className="text-2xl font-bold text-white">{stats.totalPools}</p>
                  <div className="flex justify-between mt-2">
                    <span className="text-xs text-white/50">Active: {stats.activeEvents}</span>
                    <span className="text-xs text-white/50">Completed: {stats.completedEvents}</span>
                  </div>
                </div>

                <div className="bg-[#242538] rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-white/70 text-sm">Total User Wagers</h3>
                    <DollarSign className="w-5 h-5 text-[#CCFF00]" />
                  </div>
                  <p className="text-2xl font-bold text-white">{formatCurrency(stats.totalUserWagers)}</p>
                  <div className="mt-2">
                    <span className="text-xs text-white/50">Avg Pool: {formatCurrency(stats.averagePoolSize)}</span>
                  </div>
                </div>

                <div className="bg-[#242538] rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-white/70 text-sm">Admin Liquidity</h3>
                    <DollarSign className="w-5 h-5 text-[#CCFF00]" />
                  </div>
                  <p className="text-2xl font-bold text-white">{formatCurrency(stats.totalLiquidity)}</p>
                  <div className="mt-2">
                    <span className="text-xs text-white/50">% of Total: {((stats.totalLiquidity / (stats.totalLiquidity + stats.totalUserWagers)) * 100).toFixed(1)}%</span>
                  </div>
                </div>

                <div className="bg-[#242538] rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-white/70 text-sm">Platform Revenue</h3>
                    <DollarSign className="w-5 h-5 text-[#CCFF00]" />
                  </div>
                  <p className="text-2xl font-bold text-white">{formatCurrency(stats.totalPlatformFees)}</p>
                  <div className="mt-2">
                    <span className="text-xs text-white/50">Creator Fees: {formatCurrency(stats.totalCreatorFees)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Charts */}
            {stats && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-[#242538] rounded-xl p-4 shadow-sm">
                  <h3 className="text-white font-semibold mb-4">Monthly Event Pool Activity</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={stats.monthlyData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                        <XAxis dataKey="month" stroke="#999" />
                        <YAxis stroke="#999" tickFormatter={formatCompactNumber} />
                        <Tooltip
                          formatter={(value: number) => [`₦${value.toLocaleString()}`, '']}
                          contentStyle={{ backgroundColor: '#1e1f33', border: 'none' }}
                          labelStyle={{ color: '#fff' }}
                        />
                        <Legend />
                        <Bar dataKey="totalAmount" name="Total Amount" fill="#CCFF00" />
                        <Bar dataKey="platformFees" name="Platform Fees" fill="#7440FF" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-[#242538] rounded-xl p-4 shadow-sm">
                  <h3 className="text-white font-semibold mb-4">Pool Distribution</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats.poolDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {stats.poolDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: number) => [`₦${value.toLocaleString()}`, '']}
                          contentStyle={{ backgroundColor: '#1e1f33', border: 'none' }}
                          labelStyle={{ color: '#fff' }}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* Filters and Search */}
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-700 rounded-lg bg-[#1e1f33] text-white focus:outline-none focus:ring-2 focus:ring-[#CCFF00] focus:border-transparent"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-white" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-[#1e1f33] text-white border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#CCFF00]"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {/* Event Pools Table */}
            <div className="bg-[#242538] rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead className="bg-[#1e1f33]">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort('title')}
                      >
                        <div className="flex items-center gap-1">
                          Event
                          {sortConfig.key === 'title' && (
                            <ArrowUpDown className="w-4 h-4" />
                          )}
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort('total_amount')}
                      >
                        <div className="flex items-center gap-1">
                          Total Amount
                          {sortConfig.key === 'total_amount' && (
                            <ArrowUpDown className="w-4 h-4" />
                          )}
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort('admin_liquidity')}
                      >
                        <div className="flex items-center gap-1">
                          Admin Liquidity
                          {sortConfig.key === 'admin_liquidity' && (
                            <ArrowUpDown className="w-4 h-4" />
                          )}
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort('platform_fee')}
                      >
                        <div className="flex items-center gap-1">
                          Platform Fee
                          {sortConfig.key === 'platform_fee' && (
                            <ArrowUpDown className="w-4 h-4" />
                          )}
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort('status')}
                      >
                        <div className="flex items-center gap-1">
                          Status
                          {sortConfig.key === 'status' && (
                            <ArrowUpDown className="w-4 h-4" />
                          )}
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort('updated_at')}
                      >
                        <div className="flex items-center gap-1">
                          Last Updated
                          {sortConfig.key === 'updated_at' && (
                            <ArrowUpDown className="w-4 h-4" />
                          )}
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-[#242538] divide-y divide-gray-700">
                    {filteredPools.map((pool) => (
                      <tr key={pool.id} className="hover:bg-[#2a2c42] transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <div className="text-sm font-medium text-white">{pool.event?.title || 'Unknown Event'}</div>
                            <div className="text-xs text-white/50">
                              Creator: @{pool.event?.creator?.username || 'unknown'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                          {formatCurrency(pool.total_amount || 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                          {formatCurrency(pool.admin_liquidity || 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                          {formatCurrency(pool.platform_fee || 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            pool.event?.status === 'completed' ? 'bg-green-100 text-green-800' :
                            pool.event?.status === 'active' ? 'bg-blue-100 text-blue-800' :
                            pool.event?.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {pool.event?.status || 'Unknown'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white/70">
                          {format(new Date(pool.updated_at), 'MMM d, yyyy h:mm a')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredPools.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-white/60">No event pools found matching your criteria</p>
                </div>
              )}
            </div>
          </div>
        )}
      </AdminPageLayout>
    </AdminLayout>
  );
};

export default AdminEventPools;
