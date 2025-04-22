-- Create a table to store push notification subscriptions
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can only view their own subscriptions
CREATE POLICY "Users can view their own push subscriptions"
ON push_subscriptions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own subscriptions
CREATE POLICY "Users can insert their own push subscriptions"
ON push_subscriptions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own subscriptions
CREATE POLICY "Users can update their own push subscriptions"
ON push_subscriptions FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own subscriptions
CREATE POLICY "Users can delete their own push subscriptions"
ON push_subscriptions FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Create a function to send push notifications
CREATE OR REPLACE FUNCTION send_push_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- This is a placeholder function
  -- In a real implementation, you would call an external service or edge function
  -- to send the push notification using the subscription information
  
  -- For now, we'll just log the notification
  RAISE NOTICE 'Push notification would be sent to user %', NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to send push notifications when a new notification is created
CREATE TRIGGER on_notification_created
AFTER INSERT ON notifications
FOR EACH ROW
EXECUTE FUNCTION send_push_notification();

-- Update the handle_event_deletion function to include push notification logic
CREATE OR REPLACE FUNCTION handle_event_deletion()
RETURNS TRIGGER AS $$
DECLARE
  participant_record RECORD;
  chat_participant_record RECORD;
  notification_column_name TEXT;
  notification_id UUID;
BEGIN
  -- Check if the notifications table has a 'type' or 'notification_type' column
  SELECT column_name INTO notification_column_name
  FROM information_schema.columns
  WHERE table_name = 'notifications'
  AND column_name IN ('type', 'notification_type')
  LIMIT 1;

  -- Notify event creator
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
    ) RETURNING id INTO notification_id;

    -- Notify all bet participants
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

    -- Notify all chat participants who haven't placed bets
    FOR chat_participant_record IN 
      SELECT DISTINCT ecm.sender_id 
      FROM event_chat_messages ecm
      WHERE ecm.event_id = OLD.id 
      AND ecm.sender_id != OLD.creator_id
      AND NOT EXISTS (
        SELECT 1 FROM event_participants ep 
        WHERE ep.event_id = OLD.id AND ep.user_id = ecm.sender_id
      )
    LOOP
      INSERT INTO notifications (
        user_id,
        type,
        title,
        content,
        metadata
      ) VALUES (
        chat_participant_record.sender_id,
        'event_deleted_by_admin',
        'Event Deleted by Admin',
        format('An event you chatted in ("%s") has been deleted by an administrator', OLD.title),
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

    -- Notify all bet participants
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

    -- Notify all chat participants who haven't placed bets
    FOR chat_participant_record IN 
      SELECT DISTINCT ecm.sender_id 
      FROM event_chat_messages ecm
      WHERE ecm.event_id = OLD.id 
      AND ecm.sender_id != OLD.creator_id
      AND NOT EXISTS (
        SELECT 1 FROM event_participants ep 
        WHERE ep.event_id = OLD.id AND ep.user_id = ecm.sender_id
      )
    LOOP
      INSERT INTO notifications (
        user_id,
        notification_type,
        title,
        content,
        metadata
      ) VALUES (
        chat_participant_record.sender_id,
        'event_deleted_by_admin',
        'Event Deleted by Admin',
        format('An event you chatted in ("%s") has been deleted by an administrator', OLD.title),
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
