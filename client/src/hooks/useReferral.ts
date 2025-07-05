import { useCallback, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface ReferralUser {
  id: string;
  name: string | null;
  username: string | null;
  email: string | null;
  status: string;
  joined_at: string | null;
}

export interface ReferralStats {
  totalReferrals: number;
  pendingReferrals: number;
  completedReferrals: number;
  totalRewards: number;
  users: ReferralUser[];
}

export function useReferral() {
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [stats, setStats] = useState<ReferralStats>({
    totalReferrals: 0,
    pendingReferrals: 0,
    completedReferrals: 0,
    totalRewards: 0,
    users: []
  });
  const { currentUser } = useAuth();

  const fetchReferralStats = useCallback(async () => {
    if (!currentUser) return;

    // Fetch all referrals where this user is the referrer, join with users table
    const { data: referrals, error: referralsError } = await supabase
      .from('referrals')
      .select('id, status, referred_id, created_at, users:referred_id(id, name, username, email, created_at)')
      .eq('referrer_id', currentUser.id);

    if (referralsError) {
      console.error('Error fetching referral stats:', referralsError);
      return;
    }

    // Fetch all rewards for this user
    const { data: rewards, error: rewardsError } = await supabase
      .from('referral_rewards')
      .select('amount')
      .eq('referrer_id', currentUser.id)
      .eq('paid', true);

    if (rewardsError) {
      console.error('Error fetching rewards:', rewardsError);
      return;
    }

    // Build referred users list
    const users: ReferralUser[] = (referrals || []).map((r: any) => ({
      id: r.users?.id || r.referred_id || '',
      name: r.users?.name || null,
      username: r.users?.username || null,
      email: r.users?.email || null,
      status: r.status,
      joined_at: r.users?.created_at || null
    }));

    // Calculate stats
    const totalReferrals = users.length;
    const pendingReferrals = users.filter(u => u.status === 'pending').length;
    const completedReferrals = users.filter(u => u.status === 'completed').length;
    const totalRewards = rewards?.reduce((sum, r) => sum + (r.amount || 0), 0) || 0;

    setStats({
      totalReferrals,
      pendingReferrals,
      completedReferrals,
      totalRewards,
      users
    });
  }, [currentUser]);

  const generateReferralCode = useCallback(async () => {
    if (!currentUser) return null;

    // Use username as referral code (lowercase, no spaces)
    const usernameCode = currentUser.username?.toLowerCase().replace(/\s+/g, '') || '';
    if (!usernameCode) return null;

    // Check if code is already taken
    const { data: existing, error: checkError } = await supabase
      .from('referrals')
      .select('id')
      .eq('code', usernameCode)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking referral code:', checkError);
      return null;
    }

    if (existing && existing.id && existing.referrer_id !== currentUser.id) {
      // Code taken by another user, fallback to random code
      const { data: newReferral, error: createError } = await supabase.rpc('generate_referral_code');
      if (createError) {
        console.error('Error generating fallback referral code:', createError);
        return null;
      }
      await supabase.from('referrals').insert({ referrer_id: currentUser.id, code: newReferral });
      setReferralCode(newReferral);
      return newReferral;
    }

    // If code is not taken, use username as code
    await supabase.from('referrals').upsert({ referrer_id: currentUser.id, code: usernameCode }, { onConflict: 'referrer_id' });
    setReferralCode(usernameCode);
    return usernameCode;
  }, [currentUser]);

  const applyReferralCode = useCallback(async (code: string) => {
    if (!currentUser) return false;

    const { data: referral, error } = await supabase
      .from('referrals')
      .select('referrer_id')
      .eq('code', code)
      .single();

    if (error || !referral) {
      return false;
    }

    await supabase
      .from('referrals')
      .update({ 
        referred_id: currentUser.id,
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('code', code);

    return true;
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      generateReferralCode();
      fetchReferralStats();
    }
  }, [currentUser, generateReferralCode, fetchReferralStats]);

  // Listen for referral bonus points and alert user, and send notification
  useEffect(() => {
    if (!currentUser) return;
    const channel = supabase
      .channel('referral-bonus')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'referral_rewards', filter: `referrer_id=eq.${currentUser.id}` }, async (payload) => {
        const amount = payload.new?.amount;
        if (amount) {
          alert(`You received a referral bonus of +${amount} points!`);
          // Send notification to user
          await supabase.from('notifications').insert({
            user_id: currentUser.id,
            type: 'referral_bonus',
            message: `You received a referral bonus of +${amount} points!`,
            created_at: new Date().toISOString(),
            read: false
          });
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'referral_rewards', filter: `referred_id=eq.${currentUser.id}` }, async (payload) => {
        const amount = payload.new?.amount;
        if (amount) {
          alert(`You received a signup bonus of +${amount} points for using a referral code!`);
          // Send notification to referred user
          await supabase.from('notifications').insert({
            user_id: currentUser.id,
            type: 'referral_signup_bonus',
            message: `You received a signup bonus of +${amount} points for using a referral code!`,
            created_at: new Date().toISOString(),
            read: false
          });
        }
      })
      .subscribe();
    return () => { channel.unsubscribe(); };
  }, [currentUser]);

  // Utility: get full referral link
  const referralLink = referralCode
    ? `${window.location.origin}/signup?ref=${referralCode}`
    : '';

  return {
    referralCode,
    referralLink,
    stats,
    generateReferralCode,
    applyReferralCode,
    fetchReferralStats
  };
}