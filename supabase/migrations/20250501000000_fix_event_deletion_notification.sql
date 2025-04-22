-- Fix the event_deleted_by_admin notification type issue

-- First, check if the notification_type enum exists
DO $$ 
BEGIN
    -- If the enum type exists, add the value if it doesn't already exist
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
        -- Check if the value already exists in the enum
        IF NOT EXISTS (
            SELECT 1 
            FROM pg_enum 
            WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'notification_type')
            AND enumlabel = 'event_deleted_by_admin'
        ) THEN
            -- Add the value to the enum
            ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'event_deleted_by_admin';
        END IF;
    ELSE
        -- Create the enum type with all necessary values
        CREATE TYPE notification_type AS ENUM (
            'event_win',
            'event_loss',
            'new_event',
            'event_update',
            'event_created',
            'event_participation',
            'event_joined',
            'event_milestone',
            'join_request_received',
            'event_join_request_accepted',
            'event_join_request_declined',
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
            'event_deleted_by_admin'
        );
    END IF;
END $$;

-- Update the event deletion trigger function to use the correct column name
CREATE OR REPLACE FUNCTION handle_event_deletion()
RETURNS TRIGGER AS $$
DECLARE
    participant_record RECORD;
    notification_column_name TEXT;
BEGIN
    -- Check if the notifications table has a 'type' or 'notification_type' column
    SELECT column_name INTO notification_column_name
    FROM information_schema.columns
    WHERE table_name = 'notifications'
    AND column_name IN ('type', 'notification_type')
    LIMIT 1;

    -- Notify event creator using the correct column name
    IF notification_column_name = 'type' THEN
        INSERT INTO notifications (
            user_id,
            type,
            title,
            content,
            metadata
        ) VALUES (
            OLD.creator_id,
            'event_deleted_by_admin',
            'Event Deleted by Admin',
            format('Your event "%s" has been deleted by an administrator', OLD.title),
            jsonb_build_object(
                'event_id', OLD.id,
                'event_title', OLD.title,
                'deleted_at', NOW()
            )
        );

        -- Notify all participants
        FOR participant_record IN 
            SELECT DISTINCT ep.user_id 
            FROM event_participants ep 
            WHERE ep.event_id = OLD.id 
            AND ep.user_id != OLD.creator_id
        LOOP
            INSERT INTO notifications (
                user_id,
                type,
                title,
                content,
                metadata
            ) VALUES (
                participant_record.user_id,
                'event_deleted_by_admin',
                'Event Deleted by Admin',
                format('An event you participated in ("%s") has been deleted by an administrator', OLD.title),
                jsonb_build_object(
                    'event_id', OLD.id,
                    'event_title', OLD.title,
                    'deleted_at', NOW()
                )
            );
        END LOOP;
    ELSE
        -- Using notification_type column
        INSERT INTO notifications (
            user_id,
            notification_type,
            title,
            content,
            metadata
        ) VALUES (
            OLD.creator_id,
            'event_deleted_by_admin',
            'Event Deleted by Admin',
            format('Your event "%s" has been deleted by an administrator', OLD.title),
            jsonb_build_object(
                'event_id', OLD.id,
                'event_title', OLD.title,
                'deleted_at', NOW()
            )
        );

        -- Notify all participants
        FOR participant_record IN 
            SELECT DISTINCT ep.user_id 
            FROM event_participants ep 
            WHERE ep.event_id = OLD.id 
            AND ep.user_id != OLD.creator_id
        LOOP
            INSERT INTO notifications (
                user_id,
                notification_type,
                title,
                content,
                metadata
            ) VALUES (
                participant_record.user_id,
                'event_deleted_by_admin',
                'Event Deleted by Admin',
                format('An event you participated in ("%s") has been deleted by an administrator', OLD.title),
                jsonb_build_object(
                    'event_id', OLD.id,
                    'event_title', OLD.title,
                    'deleted_at', NOW()
                )
            );
        END LOOP;
    END IF;

    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_event_deletion ON events;
CREATE TRIGGER on_event_deletion
    BEFORE DELETE ON events
    FOR EACH ROW
    EXECUTE FUNCTION handle_event_deletion();
