-- Migration: Ensure notifications table uses notification_type and not type
-- Rename column if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'notifications'
        AND column_name = 'type'
    ) THEN
        ALTER TABLE notifications RENAME COLUMN type TO notification_type;
    END IF;
END $$;

-- Add notification_type column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'notifications'
        AND column_name = 'notification_type'
    ) THEN
        ALTER TABLE notifications ADD COLUMN notification_type notification_type;
    END IF;
END $$;

-- Set default value for any null notification_type
UPDATE notifications
SET notification_type = 'system'
WHERE notification_type IS NULL;

-- Add NOT NULL constraint
ALTER TABLE notifications
ALTER COLUMN notification_type SET NOT NULL;

-- Remove type column if it still exists (safety)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'notifications'
        AND column_name = 'type'
    ) THEN
        ALTER TABLE notifications DROP COLUMN type;
    END IF;
END $$;
