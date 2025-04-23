-- Fix notifications table RLS policies

-- First, ensure the notifications table has consistent column names
DO $$ 
BEGIN
    -- Check if type column exists but notification_type doesn't
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'notifications' 
        AND column_name = 'type'
    ) AND NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'notifications' 
        AND column_name = 'notification_type'
    ) THEN
        -- Rename type to notification_type for consistency
        ALTER TABLE public.notifications 
        RENAME COLUMN type TO notification_type;
    END IF;
END $$;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "System can create notifications" ON notifications;
DROP POLICY IF EXISTS "notifications_select_policy" ON notifications;
DROP POLICY IF EXISTS "notifications_update_policy" ON notifications;
DROP POLICY IF EXISTS "notifications_insert_policy" ON notifications;

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create comprehensive policies
CREATE POLICY "Users can view their own notifications"
ON notifications FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
ON notifications FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- Allow any authenticated user to insert notifications
CREATE POLICY "Anyone can create notifications"
ON notifications FOR INSERT
TO authenticated
WITH CHECK (true);

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON notifications TO authenticated;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
