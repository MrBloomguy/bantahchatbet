-- Migration: Fix notifications table to use 'type' column consistently
-- This resolves the conflict between migrations that used 'type' vs 'notification_type'

-- Drop the notification_type column if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'notifications'
        AND column_name = 'notification_type'
    ) THEN
        ALTER TABLE notifications DROP COLUMN notification_type;
    END IF;
END $$;

-- Add type column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'notifications'
        AND column_name = 'type'
    ) THEN
        ALTER TABLE notifications ADD COLUMN type TEXT;
    END IF;
END $$;

-- Set default value for any null type
UPDATE notifications
SET type = 'system'
WHERE type IS NULL;

-- Add NOT NULL constraint
ALTER TABLE notifications
ALTER COLUMN type SET NOT NULL;

-- Remove any existing constraint and add new one for type values
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_notification_type_check;

ALTER TABLE notifications
ADD CONSTRAINT notifications_type_check 
CHECK (type IN (
    'event_win', 'event_loss', 'new_event', 'event_update',
    'event_created', 'event_participation', 'event_joined',
    'event_milestone', 'join_request_received',
    'event_join_request_accepted', 'event_join_request_declined',
    'earnings', 'follow', 'group_message', 'direct_message',
    'group_mention', 'leaderboard_update', 'challenge',
    'challenge_response', 'group_achievement', 'group_role',
    'referral', 'welcome_bonus', 'system', 'challenge_received',
    'challenge_accepted', 'challenge_declined', 'challenge_completed',
    'challenge_won', 'challenge_lost', 'challenge_expired'
));

-- Grant proper permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON notifications TO authenticated;
GRANT SELECT ON notifications TO anon;