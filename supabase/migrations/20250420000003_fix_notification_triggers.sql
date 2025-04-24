-- Fix notification triggers that are still using the 'type' column
BEGIN;

-- Drop existing triggers and functions
DROP TRIGGER IF EXISTS on_join_request_changes ON event_join_requests;
DROP FUNCTION IF EXISTS handle_join_request_changes CASCADE;

-- Create updated function for join request notifications
CREATE OR REPLACE FUNCTION handle_join_request_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        -- Notify event creator of new request
        INSERT INTO notifications (
            user_id,
            notification_type,
            title,
            content,
            metadata,
            created_at,
            updated_at,
            read
        )
        VALUES (
            (SELECT creator_id FROM events WHERE id = NEW.event_id),
            'join_request_received',
            'New Join Request',
            format('A user has requested to join your event'),
            jsonb_build_object(
                'event_id', NEW.event_id,
                'request_id', NEW.id,
                'user_id', NEW.user_id
            ),
            NOW(),
            NOW(),
            false
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER on_join_request_changes
    AFTER INSERT ON event_join_requests
    FOR EACH ROW
    EXECUTE FUNCTION handle_join_request_changes();

-- Drop other triggers that might be using 'type'
DROP TRIGGER IF EXISTS on_private_message_insert ON private_messages;
DROP FUNCTION IF EXISTS handle_private_message CASCADE;

-- Fix private message notification function
CREATE OR REPLACE FUNCTION handle_private_message()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (
    user_id,
    notification_type,
    title,
    content,
    metadata
  ) VALUES (
    NEW.receiver_id,
    'direct_message',
    'New Message',
    NEW.content,
    jsonb_build_object(
      'sender_id', NEW.sender_id,
      'message_id', NEW.id
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create or replace the trigger
CREATE TRIGGER on_private_message_insert
  AFTER INSERT ON private_messages
  FOR EACH ROW
  EXECUTE FUNCTION handle_private_message();

-- Fix event changes function
DROP TRIGGER IF EXISTS on_event_changes ON events;
DROP FUNCTION IF EXISTS handle_event_changes CASCADE;

-- Create updated function for event notifications
CREATE OR REPLACE FUNCTION handle_event_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- For new events
    IF (TG_OP = 'INSERT') THEN
        -- Notify creator
        INSERT INTO notifications (
            user_id,
            notification_type,
            title,
            content,
            metadata,
            created_at
        ) VALUES (
            NEW.creator_id,
            'event_created',
            'Event Created Successfully',
            format('Your event "%s" has been created and is now live', NEW.title),
            jsonb_build_object(
                'event_id', NEW.id,
                'event_title', NEW.title,
                'category', NEW.category
            ),
            NOW()
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER on_event_changes
    AFTER INSERT ON events
    FOR EACH ROW
    EXECUTE FUNCTION handle_event_changes();

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';

COMMIT;
