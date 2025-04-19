import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from '../contexts/ToastContext';

interface JoinEventData {
  eventId: string;
  userId: string;
  prediction: boolean;
  wagerAmount: number;
}

interface PredictionCounts {
  yes_count: number;
  no_count: number;
  total_participants: number;
}

interface MatchedBet {
  match_id: string;
  opponent_id: string;
  prediction: boolean;
  wager_amount: number;
}

export const useEventParticipation = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const toast = useToast();
  
  const joinEvent = async (data: JoinEventData): Promise<{ success: boolean; participantId?: string }> => {
    setIsProcessing(true);
    try {
      // Check if user is already participating
      const { data: existing, error: checkError } = await supabase
        .from('event_participants')
        .select('id')
        .eq('event_id', data.eventId)
        .eq('user_id', data.userId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existing) {
        toast.showError('You are already participating in this event');
        return { success: false };
      }

      // Get event details for creator fee
      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('creator_fee_percentage, creator_id')
        .eq('id', data.eventId)
        .single();

      if (eventError) throw eventError;

      // Create escrow transaction
      const { data: escrow, error: escrowError } = await supabase
        .from('event_escrow')
        .insert({
          event_id: data.eventId,
          user_id: data.userId,
          amount: data.wagerAmount,
          status: 'pending_match'
        })
        .select()
        .single();

      if (escrowError) throw escrowError;

      // Join the event
      const { data: participant, error } = await supabase
        .from('event_participants')
        .insert({
          event_id: data.eventId,
          user_id: data.userId,
          prediction: data.prediction,
          wager_amount: data.wagerAmount,
          status: 'pending_match',
          escrow_id: escrow.id
        })
        .select()
        .single();

      if (error) throw error;

      // Create notification for joining
      await supabase.from('notifications').insert({
        user_id: data.userId,
        type: 'event_join',
        event_id: data.eventId,
        message: 'You have joined the event and your stake is now in escrow. Waiting for an opponent...'
      });

      toast.showSuccess('Successfully joined the event! Waiting for an opponent...');
      return { success: true, participantId: participant.id };
    } catch (error: any) {
      console.error('Error joining event:', error);
      toast.showError(error.message || 'Failed to join event');
      return { success: false };
    } finally {
      setIsProcessing(false);
    }
  };

  const getParticipants = async (eventId: string) => {
    try {
      const { data, error } = await supabase
        .from('event_participants')
        .select(`
          *,
          user:user_id (
            id,
            username,
            avatar_url
          )
        `)
        .eq('event_id', eventId);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching participants:', error);
      return null;
    }
  };

  const getUserPrediction = async (eventId: string, userId: string) => {
    try {
      const { data, error } = await supabase
        .from('event_participants')
        .select('prediction')
        .eq('event_id', eventId)
        .eq('user_id', userId)
        .single();

      if (error) return null;
      return data.prediction;
    } catch (error) {
      console.error('Error fetching user prediction:', error);
      return null;
    }
  };

  const getPredictionCounts = async (eventId: string): Promise<PredictionCounts | null> => {
    try {
      const { data, error } = await supabase
        .from('event_predictions_summary')
        .select('*')
        .eq('event_id', eventId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching prediction counts:', error);
      return null;
    }
  };

  const getMatchedBet = async (eventId: string, userId: string): Promise<MatchedBet | null> => {
    try {
      const { data, error } = await supabase
        .from('matched_bets_view')
        .select('*')
        .eq('event_id', eventId)
        .or(`yes_user_id.eq.${userId},no_user_id.eq.${userId}`)
        .single();

      if (error) return null;

      const isYes = data.yes_user_id === userId;
      return {
        match_id: data.match_id,
        opponent_id: isYes ? data.no_user_id : data.yes_user_id,
        prediction: isYes,
        wager_amount: data.wager_amount
      };
    } catch (error) {
      console.error('Error fetching matched bet:', error);
      return null;
    }
  };

  return {
    joinEvent,
    getParticipants,
    getUserPrediction,
    getPredictionCounts,
    getMatchedBet,
    isProcessing
  };
};
