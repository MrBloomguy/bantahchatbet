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
  details: Record<string, any>;
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
      await supabase.from('admin_actions').insert({
        admin_email: admin.email,
        action_type: 'complete_event',
        target_type: 'event',
        target_id: eventId,
        details: { status: 'completed' }
      });

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
      await supabase.from('admin_actions').insert({
        admin_email: admin.email,
        action_type: 'process_payouts',
        target_type: 'event',
        target_id: eventId,
        details: { status: 'completed' }
      });

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
      const { data, error } = await supabase.rpc('get_platform_fee_stats');
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
    const { data, error } = await supabase
      .from('stories')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  };

  const createStory = async (story: Omit<Story, 'id' | 'created_at' | 'admin_id'>) => {
    const { data, error } = await supabase
      .from('stories')
      .insert([{ ...story }])
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
      await supabase.from('admin_actions').insert({
        admin_email: admin.email,
        action_type: 'delete_event',
        target_type: 'event',
        target_id: eventId,
        details: { status: 'completed' }
      });

      toast.showSuccess('Event deleted successfully');
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.showError('Failed to delete event');
    } finally {
      setLoading(false);
    }
  };

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
  };
}
