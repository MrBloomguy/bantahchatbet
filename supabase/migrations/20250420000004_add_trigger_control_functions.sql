-- Add functions to enable and disable triggers
BEGIN;

-- Function to disable triggers
CREATE OR REPLACE FUNCTION disable_triggers()
RETURNS void AS $$
DECLARE
    trigger_exists BOOLEAN;
BEGIN
    -- Check if on_join_request_changes trigger exists
    SELECT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'on_join_request_changes'
    ) INTO trigger_exists;

    IF trigger_exists THEN
        ALTER TABLE event_join_requests DISABLE TRIGGER on_join_request_changes;
    END IF;

    -- Check if on_private_message_insert trigger exists
    SELECT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'on_private_message_insert'
    ) INTO trigger_exists;

    IF trigger_exists THEN
        ALTER TABLE private_messages DISABLE TRIGGER on_private_message_insert;
    END IF;

    -- Check if on_event_changes trigger exists
    SELECT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'on_event_changes'
    ) INTO trigger_exists;

    IF trigger_exists THEN
        ALTER TABLE events DISABLE TRIGGER on_event_changes;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to enable triggers
CREATE OR REPLACE FUNCTION enable_triggers()
RETURNS void AS $$
DECLARE
    trigger_exists BOOLEAN;
BEGIN
    -- Check if on_join_request_changes trigger exists
    SELECT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'on_join_request_changes'
    ) INTO trigger_exists;

    IF trigger_exists THEN
        ALTER TABLE event_join_requests ENABLE TRIGGER on_join_request_changes;
    END IF;

    -- Check if on_private_message_insert trigger exists
    SELECT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'on_private_message_insert'
    ) INTO trigger_exists;

    IF trigger_exists THEN
        ALTER TABLE private_messages ENABLE TRIGGER on_private_message_insert;
    END IF;

    -- Check if on_event_changes trigger exists
    SELECT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'on_event_changes'
    ) INTO trigger_exists;

    IF trigger_exists THEN
        ALTER TABLE events ENABLE TRIGGER on_event_changes;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION disable_triggers TO authenticated;
GRANT EXECUTE ON FUNCTION enable_triggers TO authenticated;

COMMIT;
