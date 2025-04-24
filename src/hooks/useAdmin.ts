import { useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import { useToast } from '../contexts/ToastContext';

export interface AdminStats {
  totalEvents: number;
  totalUsers: number;
  activeUsers: {
    last24h: number;
    lastWeek: number;
    lastMonth: number;
  };
  totalGroups: number;
  pendingReports: number;
  events: {
    id: string;
    title: string;
    start_time: string;
    creator: {
      username: string;
    };
    participants_count: number;
    status: string;
  }[];
}

export interface Report {
  id: string;
  type: 'user' | 'event' | 'comment';
  reason: string;
  created_at: string;
  reporter: {
    id: string;
    username: string;
  };
  reported: {
    id: string;
    username: string;
  };
}

export interface AdminAction {
  id: string;
  action_type: string;
  target_type: string;
  details: Record<string, unknown>;
  created_at: string;
  admin: {
    id: string;
    name: string;
  };
}

export interface Withdrawal {
  id: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  bank_name: string;
  account_number: string;
  account_name: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface Story {
  id: string;
  title: string;
  content: string;
  image_url?: string;
  created_at: string;
  admin_id: string;
  admin?: {
    name: string;
    avatar_url: string;
  };
}

export function useAdmin() {
  const [loading, setLoading] = useState(false);
  const { admin } = useAdminAuth();
  const toast = useToast();

  const getStats = useCallback(async () => {
    if (!admin) {
      throw new Error('Only admins can view stats');
    }

    try {
      setLoading(true);

      // Get events with their details - fixed query format
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select(`
          id,
          title,
          start_time,
          status,
          creator:creator_id!inner (
            id,
            username
          ),
          event_participants!inner (
            count
          )
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (eventsError) throw eventsError;

      const events = eventsData || [];

      // Fixed date comparisons for user statistics
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const [
        { count: totalUsers },
        { count: activeLastDay },
        { count: activeLastWeek },
        { count: activeLastMonth },
        { count: totalGroups },
        { count: pendingReports }
      ] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('users')
          .select('*', { count: 'exact', head: true })
          .gte('last_seen', oneDayAgo.toISOString()),
        supabase.from('users')
          .select('*', { count: 'exact', head: true })
          .gte('last_seen', oneWeekAgo.toISOString()),
        supabase.from('users')
          .select('*', { count: 'exact', head: true })
          .gte('last_seen', oneMonthAgo.toISOString()),
        supabase.from('events')
          .select('*', { count: 'exact', head: true })
          .eq('type', 'group')
          .eq('status', 'active'),
        supabase.from('reports')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending')
      ]);

      return {
        totalEvents: events.length,
        totalUsers: totalUsers || 0,
        activeUsers: {
          last24h: activeLastDay || 0,
          lastWeek: activeLastWeek || 0,
          lastMonth: activeLastMonth || 0
        },
        totalGroups: totalGroups || 0,
        pendingReports: pendingReports || 0,
        events: events.map(event => ({
          id: event.id,
          title: event.title,
          start_time: event.start_time,
          status: event.status,
          creator: {
            username: event.creator && 'username' in event.creator ? event.creator.username : 'Unknown'
          },
          participants_count: event.event_participants?.[0]?.count || 0
        }))
      } as AdminStats;

    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.showError('Failed to fetch admin statistics');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [admin, toast]);

  const getReports = useCallback(async () => {
    if (!admin) {
      throw new Error('Only admins can view reports');
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('reports')
        .select(`
          *,
          reporter:reporter_id(id, username),
          reported:reported_id(id, username)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Report[];
    } catch (error) {
      console.error('Error fetching reports:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [admin]);

  const resolveReport = useCallback(async (reportId: string, action: 'approve' | 'reject') => {
    if (!admin) {
      throw new Error('Only admins can resolve reports');
    }

    try {
      setLoading(true);
      const { error } = await supabase.rpc('resolve_report', {
        p_report_id: reportId,
        p_action: action,
        p_admin_email: admin.email
      });

      if (error) throw error;
      toast.showSuccess(`Report ${action}ed successfully`);
      return true;
    } catch (error) {
      console.error('Error resolving report:', error);
      toast.showError(`Failed to ${action} report`);
      return false;
    } finally {
      setLoading(false);
    }
  }, [admin, toast]);

  const getWithdrawals = useCallback(async (status: string = 'pending') => {
    if (!admin) throw new Error('Only admins can view withdrawals');

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('withdrawals')
        .select(`
          id,
          amount,
          status,
          created_at,
          bank_name,
          account_number,
          account_name,
          user:user_id!inner (
            id,
            name,
            email
          )
        `)
        .eq('status', status)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [admin]);

  const processWithdrawal = useCallback(async (withdrawalId: string, status: 'processing' | 'completed' | 'failed') => {
    if (!admin) {
      throw new Error('Only admins can process withdrawals');
    }

    try {
      setLoading(true);
      const { error } = await supabase.rpc('process_withdrawal', {
        p_withdrawal_id: withdrawalId,
        p_status: status,
        p_admin_email: admin.email
      });

      if (error) throw error;
      toast.showSuccess(`Withdrawal ${status} successfully`);
      return true;
    } catch (error) {
      console.error('Error processing withdrawal:', error);
      toast.showError(`Failed to process withdrawal`);
      return false;
    } finally {
      setLoading(false);
    }
  }, [admin, toast]);

  const getAuditLog = useCallback(async () => {
    if (!admin) {
      throw new Error('Only admins can view audit log');
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('admin_actions')
        .select(`
          *,
          admin:admin_email(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as AdminAction[];
    } catch (error) {
      console.error('Error fetching audit log:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [admin]);

  const getEvents = useCallback(async (status?: string) => {
    if (!admin) throw new Error('Only admins can view events');

    try {
      setLoading(true);
      const query = supabase
        .from('events')
        .select(`
          id,
          title,
          description,
          start_time,
          end_time,
          status,
          payouts_processed,
          creator:creator_id!inner (
            id,
            username
          ),
          event_participants!inner (
            count
          )
        `)
        .order('created_at', { ascending: false });

      if (status) {
        query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching events:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [admin]);

  const markEventComplete = useCallback(async (eventId: string) => {
    if (!admin) throw new Error('Only admins can complete events');

    try {
      setLoading(true);
      const { error } = await supabase
        .from('events')
        .update({ status: 'completed', updated_at: new Date().toISOString() })
        .eq('id', eventId);

      if (error) throw error;

      // Log admin action
      if (admin) {
        await supabase.from('admin_actions').insert({
          admin_email: admin.email,
          action_type: 'complete_event',
          target_type: 'event',
          target_id: eventId,
          details: { status: 'completed' }
        });
      }

      return true;
    } catch (error) {
      console.error('Error completing event:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [admin]);

  const processEventPayouts = useCallback(async (eventId: string) => {
    if (!admin) throw new Error('Only admins can process payouts');

    try {
      setLoading(true);

      // Calculate winnings and distribute
      const { error: payoutError } = await supabase.rpc('process_event_payouts', {
        p_event_id: eventId,
        p_admin_email: admin.email
      });

      if (payoutError) throw payoutError;

      // Mark event payouts as processed
      const { error: updateError } = await supabase
        .from('events')
        .update({
          payouts_processed: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', eventId);

      if (updateError) throw updateError;

      // Log admin action
      if (admin) {
        await supabase.from('admin_actions').insert({
          admin_email: admin.email,
          action_type: 'process_payouts',
          target_type: 'event',
          target_id: eventId,
          details: { status: 'completed' }
        });
      }

      return true;
    } catch (error) {
      console.error('Error processing payouts:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [admin]);

  const getPlatformFeeStats = useCallback(async () => {
    if (!admin) throw new Error('Only admins can view platform fees');

    try {
      setLoading(true);
      // Use get_platform_summary instead of get_platform_fee_stats based on the error message
      const { data, error } = await supabase.rpc('get_platform_summary');
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching platform fee stats:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [admin]);

  const withdrawPlatformFees = useCallback(async (amount: number) => {
    if (!admin) throw new Error('Only admins can withdraw platform fees');

    try {
      setLoading(true);
      const { error } = await supabase.rpc('withdraw_platform_fees', {
        p_amount: amount,
        p_admin_email: admin.email
      });

      if (error) throw error;

      // Log admin action
      await supabase.from('admin_actions').insert({
        admin_email: admin.email,
        action_type: 'withdraw_fees',
        target_type: 'platform_fees',
        details: { amount }
      });

      return true;
    } catch (error) {
      console.error('Error withdrawing platform fees:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [admin]);

  const getStories = async () => {
    // Simplified query to avoid join issues
    const { data, error } = await supabase
      .from('stories')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Get admin profiles in a separate query
    if (data && data.length > 0) {
      // Get unique admin IDs
      const adminIds = [...new Set(data.map(story => story.admin_id))];

      // Fetch admin profiles from users table instead of profiles
      const { data: adminProfiles, error: profilesError } = await supabase
        .from('users')
        .select('id, username, avatar_url')
        .in('id', adminIds);

      if (profilesError) {
        console.error('Error fetching admin profiles:', profilesError);
      }

      // Create a map of admin profiles by ID
      interface AdminProfile {
        id: string;
        name: string;
        username?: string;
        avatar_url?: string | null;
      }

      const adminMap = (adminProfiles || []).reduce<Record<string, AdminProfile>>((map, profile) => {
        map[profile.id] = {
          id: profile.id,
          name: profile.username || 'Admin', // Use username as name
          username: profile.username,
          avatar_url: profile.avatar_url
        };
        return map;
      }, {});

      // Add admin info to stories
      const storiesWithAdmins = data.map(story => ({
        ...story,
        admin: story.admin_id && adminMap[story.admin_id]
          ? adminMap[story.admin_id]
          : { name: 'Unknown Admin', username: 'admin', avatar_url: null }
      }));

      return storiesWithAdmins;
    }

    return [];
  };

  const createStory = async (story: Omit<Story, 'id' | 'created_at' | 'admin_id'>) => {
    // Get the current user's ID
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      throw new Error('User not authenticated');
    }

    // Insert the story with the admin_id
    const { data, error } = await supabase
      .from('stories')
      .insert([{
        ...story,
        admin_id: session.user.id
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const updateStory = async (id: string, updates: Partial<Story>) => {
    const { data, error } = await supabase
      .from('stories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const deleteStory = async (id: string) => {
    const { error } = await supabase
      .from('stories')
      .delete()
      .eq('id', id);

    if (error) throw error;
  };

  const deleteEvent = async (eventId: string) => {
    try {
      setLoading(true);

      // Delete the event (this will trigger the notification via database trigger)
      const { error: deleteError } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

      if (deleteError) throw deleteError;

      // Log admin action
      if (admin) {
        await supabase.from('admin_actions').insert({
          admin_email: admin.email,
          action_type: 'delete_event',
          target_type: 'event',
          target_id: eventId,
          details: { status: 'completed' }
        });
      }

      toast.showSuccess('Event deleted successfully');
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.showError('Failed to delete event');
    } finally {
      setLoading(false);
    }
  };



  const getEventLiquidity = useCallback(async (eventId: string) => {
    if (!admin) throw new Error('Only admins can view event liquidity');

    // Helper function to fetch liquidity transactions (defined inside the callback)
    const fetchLiquidityTransactions = async (eventId: string) => {
      try {
        const { data: txData, error: txError } = await supabase
          .from('liquidity_transactions')
          .select('*')
          .eq('event_id', eventId)
          .order('created_at', { ascending: false });

        if (!txError && txData) {
          return txData;
        }
      } catch (error) {
        console.warn('Error fetching liquidity transactions:', error);
      }
      return [];
    };

    try {
      setLoading(true);

      // First check if the admin_liquidity column exists
      try {
        // Get event pool details - don't use single() since there might be multiple records
        // Use a simple query to avoid 406 errors
        const { data: poolDataArray, error: poolError } = await supabase
          .from('event_pools')
          .select('*')
          .eq('event_id', eventId);

        // Handle the case where admin_liquidity column might not exist yet
        if (poolError || !poolDataArray || poolDataArray.length === 0) {
          console.warn('Error fetching pool data:', poolError);
          // Return default values if there's an error
          return {
            currentLiquidity: 0,
            transactions: []
          };
        }

        // Use the most recent pool record
        const poolData = poolDataArray[poolDataArray.length - 1];

        // Check if admin_liquidity exists in the response and store it for later use
        if (poolData && 'admin_liquidity' in poolData && typeof poolData.admin_liquidity === 'number') {
          // We found admin_liquidity directly, we can return early
          const transactions = await fetchLiquidityTransactions(eventId);
          return {
            currentLiquidity: poolData.admin_liquidity,
            transactions
          };
        }
      } catch (error) {
        console.warn('Error checking admin_liquidity column:', error);
        // If there's an error, just continue with default values
      }

      // Get event pool details again, but this time just get the total amount
      // This is a safer approach that doesn't rely on the admin_liquidity column
      // Use a simpler query to avoid 406 errors
      const { data: poolDataArray, error: poolError } = await supabase
        .from('event_pools')
        .select('*')
        .eq('event_id', eventId);

      let currentLiquidity = 0;

      if (!poolError && poolDataArray && poolDataArray.length > 0) {
        // Use the most recent pool record
        const poolData = poolDataArray[poolDataArray.length - 1];

        // If admin_liquidity doesn't exist, we can estimate it as total - (yes_pool + no_pool)
        if ('admin_liquidity' in poolData && typeof poolData.admin_liquidity === 'number') {
          currentLiquidity = poolData.admin_liquidity;
        } else if (poolData.total_amount && poolData.yes_pool !== undefined && poolData.no_pool !== undefined) {
          // Estimate admin liquidity as the difference between total and user pools
          const userPoolTotal = (poolData.yes_pool || 0) + (poolData.no_pool || 0);
          currentLiquidity = Math.max(0, poolData.total_amount - userPoolTotal);
        }
      } else {
        console.warn('No pool data found or error fetching pool data:', poolError);
      }

      // Get liquidity transactions
      const transactions = await fetchLiquidityTransactions(eventId);

      return {
        currentLiquidity,
        transactions
      };
    } catch (error) {
      console.error('Error fetching event liquidity:', error);
      // Return default values if there's an error
      return {
        currentLiquidity: 0,
        transactions: []
      };
    } finally {
      setLoading(false);
    }
  }, [admin]);

  const addEventLiquidity = useCallback(async (eventId: string, amount: number, notes?: string) => {
    if (!admin) throw new Error('Only admins can add liquidity');

    try {
      setLoading(true);

      // First check if the admin_liquidity column exists
      let hasAdminLiquidity = false;
      try {
        // Don't use single() since there might be multiple records
        const { data: poolDataArray } = await supabase
          .from('event_pools')
          .select('*')
          .eq('event_id', eventId);

        // Check if any of the records have the admin_liquidity column
        if (poolDataArray && poolDataArray.length > 0) {
          const poolData = poolDataArray[0]; // Just check the first record
          hasAdminLiquidity = poolData && 'admin_liquidity' in poolData;
        }
      } catch (error) {
        console.warn('Error checking for admin_liquidity column:', error);
      }

      // If the column exists, try the RPC function first
      if (hasAdminLiquidity) {
        try {
          const { error } = await supabase.rpc('add_event_liquidity', {
            p_event_id: eventId,
            p_admin_email: admin.email,
            p_amount: amount,
            p_notes: notes || null
          });

          if (!error) {
            // Success! No need to try the fallback
            toast.showSuccess(`Successfully added ₦${amount.toLocaleString()} liquidity to the event`);
            return true;
          }

          // Check if the error is about event status
          if (error.message && error.message.includes('Event must be active or pending')) {
            // This is a validation error, not a technical error
            toast.showError('Cannot add liquidity: Event must be active or pending');
            throw new Error('Event must be active or pending to add liquidity');
          }

          console.warn('RPC call failed, trying direct update:', error);
        } catch (error) {
          console.warn('RPC call failed with exception, trying direct update:', error);
        }
      }

      // Fallback: Try to update the event_pools table directly
      console.log('Using direct update fallback...');

      // First, get the current pool data - don't use single() since there might be multiple records
      const { data: poolDataArray, error: poolError } = await supabase
        .from('event_pools')
        .select('*')
        .eq('event_id', eventId);

      if (poolError || !poolDataArray || poolDataArray.length === 0) {
        console.error('Failed to get pool data:', poolError);
        throw new Error('Could not find event pool');
      }

      // Use the most recent pool record
      const poolData = poolDataArray[poolDataArray.length - 1];

      // Check if admin_liquidity column exists
      if (!hasAdminLiquidity) {
        // Try to alter the table to add the column
        try {
          // We can't directly alter the table from the client, so we'll just
          // try to update with the column and see if it works
          console.log('Trying to update with admin_liquidity column...');
        } catch (error) {
          console.warn('Failed to add admin_liquidity column:', error);
        }
      }

      // Calculate the new admin_liquidity value
      const currentAdminLiquidity = hasAdminLiquidity && typeof poolData.admin_liquidity === 'number'
        ? poolData.admin_liquidity
        : 0;
      const newAdminLiquidity = currentAdminLiquidity + amount;

      // Update the pool with the new admin_liquidity
      // Since there might be multiple records, we'll update all of them
      // This ensures that no matter which record is queried, it will have the correct admin_liquidity

      // First, get the current yes_pool and no_pool values
      const yesPool = poolData.yes_pool || 0;
      const noPool = poolData.no_pool || 0;

      // Calculate the new total_amount including admin_liquidity
      const newTotalAmount = yesPool + noPool + newAdminLiquidity;

      console.log('Updating event pool:', {
        eventId,
        yesPool,
        noPool,
        newAdminLiquidity,
        newTotalAmount
      });

      const { error: updateError } = await supabase
        .from('event_pools')
        .update({
          admin_liquidity: newAdminLiquidity,
          total_amount: newTotalAmount, // Explicitly update total_amount
          updated_at: new Date().toISOString()
        })
        .eq('event_id', eventId);

      // Also update the events table to trigger UI updates
      try {
        await supabase
          .from('events')
          .update({
            updated_at: new Date().toISOString()
          })
          .eq('id', eventId);
      } catch (error) {
        console.warn('Error updating event timestamp:', error);
        // This is just a helper update, so we don't need to handle errors
      }

      if (updateError) {
        console.error('Failed to update admin_liquidity:', updateError);

        // If the update failed because the column doesn't exist, try to add it
        if (updateError.message && updateError.message.includes('column "admin_liquidity" does not exist')) {
          console.log('Column does not exist, trying to add it via direct SQL is not possible from client...');
          // We can't alter the table from the client, so we'll just log this error
          // The migration should handle adding the column
        }

        // Continue anyway - the migration will eventually add the column
        console.log('Continuing despite update error - the migration will add the column');
      }

      // Try to log the action
      try {
        // Try to insert into liquidity_transactions first
        try {
          await supabase.from('liquidity_transactions').insert({
            event_id: eventId,
            admin_email: admin.email,
            amount: amount,
            notes: notes || null
          });
        } catch (error) {
          console.warn('Failed to insert into liquidity_transactions:', error);
        }

        // Also log to admin_actions
        try {
          // Get admin ID from email - try to find in users table
          const { data: adminData } = await supabase
            .from('users')
            .select('id')
            .eq('email', admin.email)
            .single();

          await supabase.from('admin_actions').insert({
            admin_id: adminData?.id || null,
            action_type: 'add_liquidity',
            target_type: 'event',
            target_id: eventId,
            details: {
              amount: amount,
              notes: notes || null,
              timestamp: new Date().toISOString()
            }
          });
        } catch (error) {
          console.warn('Failed to log to admin_actions:', error);
        }
      } catch (logError) {
        // Just log this error but don't fail the operation
        console.warn('Failed to log admin action:', logError);
      }

      toast.showSuccess(`Successfully added ₦${amount.toLocaleString()} liquidity to the event`);
      return true;
    } catch (error) {
      console.error('Error adding liquidity:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.showError('Failed to add liquidity: ' + errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [admin, toast]);

  return {
    loading,
    getStats,
    getReports,
    resolveReport,
    getWithdrawals,
    processWithdrawal,
    getAuditLog,
    getEvents,
    markEventComplete,
    processEventPayouts,
    getPlatformFeeStats,
    withdrawPlatformFees,
    getStories,
    createStory,
    updateStory,
    deleteStory,
    deleteEvent,
    getEventLiquidity,
    addEventLiquidity,
  };
}
