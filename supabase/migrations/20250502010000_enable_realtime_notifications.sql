-- Enable realtime for notifications table
BEGIN;

-- Enable the realtime publication for the notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Make sure RLS policies are in place for notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create or replace RLS policies for notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
CREATE POLICY "Users can view their own notifications"
ON notifications FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
CREATE POLICY "Users can update their own notifications"
ON notifications FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

COMMIT;
