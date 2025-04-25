import { supabase } from '../lib/supabase';

/**
 * Utility function to manually check for and handle past scheduled challenges
 * This can be called from various places in the application to ensure challenges
 * with past scheduled dates are properly marked as missed
 */
export const handlePastScheduledChallenges = async (): Promise<void> => {
  try {
    // Call the database function to handle past scheduled challenges
    const { error } = await supabase.rpc('handle_past_scheduled_challenges');
    
    if (error) {
      console.error('Error handling past scheduled challenges:', error);
    } else {
      console.log('Successfully checked for past scheduled challenges');
    }
  } catch (error) {
    console.error('Exception handling past scheduled challenges:', error);
  }
};

/**
 * Check if a challenge's scheduled date has passed
 * @param scheduledAt The scheduled date of the challenge
 * @returns True if the scheduled date has passed, false otherwise
 */
export const isScheduledDatePast = (scheduledAt: string | null | undefined): boolean => {
  if (!scheduledAt) return false;
  
  try {
    const scheduledDate = new Date(scheduledAt);
    const now = new Date();
    return scheduledDate < now;
  } catch (e) {
    console.error('Error checking if scheduled date is past:', e);
    return false;
  }
};
