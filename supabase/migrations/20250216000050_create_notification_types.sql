-- First check if the type exists, if not create it
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
        CREATE TYPE notification_type AS ENUM (
            'event_win',
            'event_loss',
            'new_event',
            'event_update',
            'event_created',
            'event_participation',
            'event_joined',
            'event_milestone',
            'earnings',
            'follow',
            'group_message',
            'direct_message',
            'group_mention',
            'leaderboard_update',
            'challenge',
            'challenge_response',
            'group_achievement',
            'group_role',
            'referral',
            'welcome_bonus',
            'deposit',
            'withdrawal',
            'system',
            'friend_request',
            'friend_request_accepted',
            'friend_request_declined',
            'event_join_request_accepted',
            'event_join_request_declined',
            'event_deleted_by_admin'
        );
    ELSE
        -- Add new enum value if type already exists
        ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'event_deleted_by_admin';
    END IF;
END $$;

-- Alter the notifications table to use the enum type
ALTER TABLE notifications 
    ALTER COLUMN type TYPE notification_type 
    USING type::notification_type;
