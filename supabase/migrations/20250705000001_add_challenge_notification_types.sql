-- Add missing challenge notification types to the notification_type enum
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'challenge_received';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'challenge_accepted';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'challenge_declined';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'challenge_completed';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'challenge_won';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'challenge_lost';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'challenge_expired';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'challenge_missed';

-- Add a policy for system/service account to insert notifications
CREATE POLICY "System can insert notifications for challenges"
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (true);

-- Update the existing system policy if it exists
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
CREATE POLICY "System can insert notifications"
ON public.notifications FOR INSERT
WITH CHECK (true);