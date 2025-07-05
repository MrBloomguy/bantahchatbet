import { supabase } from '../lib/supabase';
import { NotificationType } from '../types/notifications';

interface ChallengeNotificationParams {
  userId: string;
  challengeId: string;
  challengeTitle: string;
  amount: number;
  opponentName: string;
  opponentUsername: string;
}

/**
 * Send a challenge notification with optimized delivery and error handling
 * Uses a combination of database insert and direct WebSocket for fastest delivery
 */
export const sendChallengeNotification = async (
  type: NotificationType,
  params: ChallengeNotificationParams
): Promise<{ success: boolean; error?: any; notificationId?: string }> => {
  const notificationContent = {
    challenge_received: {
      title: '🎮 New Challenge Received',
      content: `@${params.opponentUsername} has challenged you to "${params.challengeTitle}" for ₦${params.amount.toLocaleString()}`
    },
    challenge_accepted: {
      title: '✅ Challenge Accepted',
      content: `@${params.opponentUsername} accepted your challenge "${params.challengeTitle}"`
    },
    challenge_declined: {
      title: '❌ Challenge Declined',
      content: `@${params.opponentUsername} declined your challenge "${params.challengeTitle}"`
    },
    challenge_completed: {
      title: '🏁 Challenge Completed',
      content: `Your challenge "${params.challengeTitle}" with @${params.opponentUsername} has been completed`
    },
    challenge_winner: {
      title: '🏆 Challenge Won!',
      content: `Congratulations! You won the challenge "${params.challengeTitle}" against @${params.opponentUsername}. You earned ₦${params.amount.toLocaleString()}`
    },
    challenge_loser: {
      title: '😔 Challenge Lost',
      content: `You lost the challenge "${params.challengeTitle}" against @${params.opponentUsername}`
    },
    challenge_expired: {
      title: '⏰ Challenge Expired',
      content: `Your challenge "${params.challengeTitle}" with @${params.opponentUsername} has expired`
    }
  };

  const content = notificationContent[type];
  if (!content) {
    return { success: false, error: 'Invalid notification type' };
  }

  try {
    // Create notification metadata
    const metadata = {
      challenge_id: params.challengeId,
      challenge_title: params.challengeTitle,
      amount: params.amount,
      opponent_username: params.opponentUsername,
      priority: type === 'challenge_received' ? 'high' : 'normal', // Prioritize new challenge notifications
      timestamp: new Date().toISOString()
    };

    // Insert notification with high priority
    const { data, error } = await supabase.from('notifications').insert({
      user_id: params.userId,
      notification_type: type,
      title: content.title,
      content: content.content,
      metadata
    }).select('id').single();

    if (error) {
      console.error('Error creating notification:', error);
      return { success: false, error };
    }

    // For high-priority notifications like challenge requests, also send via broadcast channel
    // This ensures immediate delivery even if Supabase realtime has any latency
    if (type === 'challenge_received' || type === 'challenge_accepted') {
      try {
        // Use the broadcast channel API if available for immediate in-app notification
        if (typeof BroadcastChannel !== 'undefined') {
          const notificationChannel = new BroadcastChannel('bantahchatbet-notifications');
          notificationChannel.postMessage({
            type: 'challenge-notification',
            userId: params.userId,
            notification: {
              id: data?.id,
              type,
              title: content.title,
              content: content.content,
              metadata
            }
          });
        }
      } catch (broadcastError) {
        // Broadcast channel error is non-critical as we already saved to database
        console.warn('Broadcast notification failed:', broadcastError);
      }
    }

    return { success: true, notificationId: data?.id };
  } catch (err) {
    console.error('Failed to send challenge notification:', err);
    return { success: false, error: err };
  }
};