-- Migration: Add 'system' to notification_type enum (must be run and committed before any UPDATE/INSERT uses it)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
        WHERE t.typname = 'notification_type' AND e.enumlabel = 'system'
    ) THEN
        ALTER TYPE notification_type ADD VALUE 'system';
    END IF;
END $$;
