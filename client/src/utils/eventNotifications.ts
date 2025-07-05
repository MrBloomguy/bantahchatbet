import { supabase } from '../lib/supabase';
import { NotificationType } from '../types/notifications';

interface EventNotificationParams {
  userId: string;
  eventId: string;
  eventTitle: string;
  wagerAmount: number;
  eventType: 'public' | 'private' | 'challenge';  // Add event type
  prediction?: boolean;
  earnings?: number;
  opponentId?: string;
  opponentUsername?: string;
  senderUsername?: string;
  receiverUsername?: string;
}

export const formatUsername = (username: string) => `@${username}`;

export const sendEventNotification = async (
  type: NotificationType,
  params: EventNotificationParams
) => {
  const notificationContent = {
    // Public Event Notifications
    public_event_joined: {
      title: '✅ Joined Public Event',
      content: `${formatUsername(params.receiverUsername!)}, you've placed a ${params.prediction ? 'YES' : 'NO'} prediction on "${params.eventTitle}"`
    },
    public_event_participation: {
      title: '👥 New Participant',
      content: `${formatUsername(params.senderUsername!)} has joined your public event "${params.eventTitle}"`
    },

    // Private Event Notifications
    private_event_join_request: {
      title: '📫 Join Request Sent',
      content: `${formatUsername(params.receiverUsername!)}, your request to join "${params.eventTitle}" has been sent to ${formatUsername(params.senderUsername!)}`
    },
    private_event_join_request_received: {
      title: '📫 New Join Request',
      content: `${formatUsername(params.receiverUsername!)}, ${formatUsername(params.senderUsername!)} wants to join your private event "${params.eventTitle}"`
    },
    private_event_join_request_accepted: {
      title: '✅ Join Request Accepted',
      content: `${formatUsername(params.receiverUsername!)}, ${formatUsername(params.senderUsername!)} has accepted your request to join "${params.eventTitle}"`
    },
    private_event_join_request_declined: {
      title: '❌ Join Request Declined',
      content: `${formatUsername(params.receiverUsername!)}, ${formatUsername(params.senderUsername!)} has declined your request to join "${params.eventTitle}"`
    },

    // Challenge Event Notifications
    challenge_created: {
      title: '⚔️ New Challenge Created',
      content: `${formatUsername(params.receiverUsername!)}, ${formatUsername(params.senderUsername!)} has created a challenge "${params.eventTitle}"`
    },
    challenge_accepted: {
      title: '🤝 Challenge Accepted',
      content: `${formatUsername(params.receiverUsername!)}, ${formatUsername(params.senderUsername!)} has accepted your challenge in "${params.eventTitle}"`
    },
    challenge_declined: {
      title: '❌ Challenge Declined',
      content: `${formatUsername(params.receiverUsername!)}, ${formatUsername(params.senderUsername!)} has declined your challenge in "${params.eventTitle}"`
    },
    challenge_matched: {
      title: '⚔️ Challenge Match Found',
      content: `${formatUsername(params.receiverUsername!)}, ${formatUsername(params.senderUsername!)} has matched your ${params.prediction ? 'YES' : 'NO'} prediction in "${params.eventTitle}"`
    },

    // Common Notifications (apply to all event types)
    event_win: {
      title: '🎉 Congratulations! You Won!',
      content: `${formatUsername(params.receiverUsername!)}, you won your prediction on "${params.eventTitle}"! Earnings: ₦${params.earnings?.toLocaleString()}`
    },
    event_loss: {
      title: '😔 Prediction Lost',
      content: `${formatUsername(params.receiverUsername!)}, your prediction on "${params.eventTitle}" didn't win against ${formatUsername(params.opponentUsername!)}`
    },
    event_ended: {
      title: '🏁 Event Ended',
      content: `${formatUsername(params.receiverUsername!)}, the event "${params.eventTitle}" has concluded.`
    },
    event_cancelled: {
      title: '❌ Event Cancelled',
      content: `${formatUsername(params.receiverUsername!)}, the event "${params.eventTitle}" has been cancelled.`
    }
  };

  // Select notification based on event type and notification type
  let notificationType = type;
  if (type === 'event_joined' || type === 'event_participation') {
    notificationType = `${params.eventType}_${type}` as NotificationType;
  }

  const content = notificationContent[notificationType];
  if (!content) return;

  return await supabase.from('notifications').insert({
    user_id: params.userId,
    notification_type: notificationType,
    title: content.title,
    content: content.content,
    metadata: {
      event_id: params.eventId,
      event_title: params.eventTitle,
      event_type: params.eventType,
      wager_amount: params.wagerAmount,
      prediction: params.prediction,
      earnings: params.earnings,
      opponent_id: params.opponentId,
      opponent_username: params.opponentUsername,
      sender_username: params.senderUsername,
      receiver_username: params.receiverUsername
    }
  });
};
