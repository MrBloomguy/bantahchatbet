import { supabase } from '../lib/supabase';

// Define specific notification types for points
type PointsNotificationType = 
  | 'points_earned'
  | 'points_deducted'
  | 'level_up'
  | 'achievement_unlocked'
  | 'daily_streak'
  | 'weekly_points_summary'
  | 'monthly_points_summary';

interface PointsNotificationParams {
  userId: string;
  points: number;
  action: string;
  level?: {
    name: string;
    benefits: string[];
  };
  achievement?: string;
  streak?: number;
}

export const sendPointsNotification = async (
  type: PointsNotificationType,
  params: PointsNotificationParams
) => {
  const notificationContent: Record<PointsNotificationType, { title: string; content: string }> = {
    points_earned: {
      title: '🎯 Points Earned',
      content: `You earned ${params.points} points for ${params.action}`
    },
    points_deducted: {
      title: '📉 Points Deducted',
      content: `${params.points} points were deducted for ${params.action}`
    },
    level_up: {
      title: '🎉 Level Up!',
      content: `Congratulations! You've reached ${params.level?.name} level!`
    },
    achievement_unlocked: {
      title: '🏆 Achievement Unlocked',
      content: `You've unlocked the "${params.achievement}" achievement!`
    },
    daily_streak: {
      title: '🔥 Streak Milestone',
      content: `You're on a ${params.streak}-day streak! Keep it up!`
    },
    weekly_points_summary: {
      title: '📊 Weekly Points Update',
      content: `You earned ${params.points} points this week`
    },
    monthly_points_summary: {
      title: '📈 Monthly Points Summary',
      content: `You earned ${params.points} points this month`
    }
  };

  const content = notificationContent[type];
  if (!content) return;

  return await supabase.from('notifications').insert({
    user_id: params.userId,
    notification_type: type,
    title: content.title,
    content: content.content,
    metadata: {
      points: params.points,
      action: params.action,
      level: params.level,
      achievement: params.achievement,
      streak: params.streak
    }
  });
};