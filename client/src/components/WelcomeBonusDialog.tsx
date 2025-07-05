import React, { useState } from 'react';
import { Gift, Star, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';
import LoadingSpinner from './LoadingSpinner';

interface WelcomeBonusDialogProps {
  onClose: () => void;
  isReferred?: boolean;
  referrerName?: string;
}

const WelcomeBonusDialog: React.FC<WelcomeBonusDialogProps> = ({ 
  onClose, 
  isReferred,
  referrerName 
}) => {
  const [loading, setLoading] = useState(false);
  const { currentUser } = useAuth();
  const toast = useToast();

  const handleClaim = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);

      // Get referrer ID from URL if present
      const params = new URLSearchParams(window.location.search);
      const referralCode = params.get('ref');
      let referrerId: string | undefined;

      if (referralCode) {
        const { data: referrer } = await supabase
          .from('users')
          .select('id')
          .eq('username', referralCode)
          .single();

        if (referrer) {
          referrerId = referrer.id;
        }
      }

      // Claim bonus
      const { data, error } = await supabase
        .rpc('claim_welcome_bonus', { 
          p_user_id: currentUser.id,
          p_referrer_id: referrerId
        });

      if (error) throw error;

      if (data) {
        toast.showSuccess('Welcome bonus claimed successfully!');
      } else {
        toast.showError('Failed to claim welcome bonus');
      }

      onClose();
    } catch (error) {
      console.error('Error claiming bonus:', error);
      toast.showError('Failed to claim welcome bonus');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="relative max-w-sm w-full">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-2 -right-2 w-8 h-8 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Main card */}
        <div className="bg-gradient-to-br from-[#CCFF00] to-[#7C3AED] rounded-2xl p-1">
          <div className="bg-[#242538]/90 backdrop-blur-sm rounded-xl p-6 text-center">
            {/* Floating stars decoration */}
            <div className="absolute -top-3 -left-3">
              <Star className="w-6 h-6 text-[#CCFF00] animate-pulse" />
            </div>
            <div className="absolute -bottom-2 -right-2">
              <Star className="w-5 h-5 text-[#CCFF00] animate-pulse delay-75" />
            </div>

            {/* Gift icon */}
            <div className="w-20 h-20 rounded-full bg-[#CCFF00]/20 flex items-center justify-center mx-auto mb-4">
              <Gift className="w-10 h-10 text-[#CCFF00]" />
            </div>

            {/* Welcome text */}
            <h2 className="text-2xl font-bold text-white mb-2">
              {isReferred ? 'Welcome to Bantah! 🎉' : 'Welcome Bonus! 🎉'}
            </h2>
            
            {/* Bonus amount */}
            <div className="bg-[#CCFF00]/20 rounded-xl p-4 mb-4">
              <p className="text-[#CCFF00] text-3xl font-bold">₦1,000</p>
              <p className="text-white/60">Welcome Points</p>
            </div>

            {/* Referral message */}
            {isReferred && referrerName && (
              <p className="text-white/80 mb-4">
                You were referred by <span className="text-[#CCFF00] font-medium">{referrerName}</span>
              </p>
            )}

            {/* Description */}
            <p className="text-white/60 text-sm mb-6">
              Start your journey with ₦1,000 bonus points! Use them to participate in events and challenges.
            </p>

            {/* Claim button */}
            <button
              onClick={handleClaim}
              disabled={loading}
              className="w-full py-3 bg-[#CCFF00] text-black rounded-xl font-medium hover:bg-[#b3ff00] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" color="#000000" />
                  <span>Claiming...</span>
                </>
              ) : (
                'Claim Bonus'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeBonusDialog;