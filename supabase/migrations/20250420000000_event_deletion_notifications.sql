-- Function to handle event deletion notifications
CREATE OR REPLACE FUNCTION handle_event_deletion()
RETURNS TRIGGER AS $$
DECLARE
    participant_record RECORD;
BEGIN
    -- Notify event creator
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

    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for event deletion
DROP TRIGGER IF EXISTS on_event_deletion ON events;
CREATE TRIGGER on_event_deletion
    BEFORE DELETE ON events
    FOR EACH ROW
    EXECUTE FUNCTION handle_event_deletion();