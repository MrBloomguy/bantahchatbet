-- Enhance event notifications system

-- Create a function to send notifications to all participants when an event is completed
CREATE OR REPLACE FUNCTION send_event_completion_notifications(p_event_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_event_record record;
    v_winner_prediction boolean;
    v_creator_id uuid;
BEGIN
    -- Get event details
    SELECT * INTO v_event_record
    FROM events
    WHERE id = p_event_id;

    -- Exit if event is not completed
    IF v_event_record.status != 'completed' THEN
        RETURN;
    END IF;

    -- Get winner prediction and creator
    v_winner_prediction := v_event_record.result;
    v_creator_id := v_event_record.creator_id;

    -- Send notification to all participants
    INSERT INTO notifications (
        user_id,
        notification_type,
        title,
        content,
        metadata
    )
    SELECT 
        user_id,
        CASE 
            WHEN prediction = v_winner_prediction THEN 'event_win'
            ELSE 'event_loss'
        END,
        CASE 
            WHEN prediction = v_winner_prediction THEN 'You Won an Event!'
            ELSE 'Event Completed'
        END,
        CASE 
            WHEN prediction = v_winner_prediction THEN 'Congratulations! You predicted correctly in the event "' || v_event_record.title || '". Your winnings will be processed soon.'
            ELSE 'The event "' || v_event_record.title || '" has completed. Unfortunately, your prediction was incorrect.'
        END,
        jsonb_build_object(
            'event_id', p_event_id,
            'event_title', v_event_record.title,
            'prediction', prediction,
            'result', v_winner_prediction,
            'completed_at', NOW()
        )
    FROM event_participants
    WHERE event_id = p_event_id;

    -- Send notification to creator
    IF v_creator_id IS NOT NULL THEN
        INSERT INTO notifications (
            user_id,
            notification_type,
            title,
            content,
            metadata
        ) VALUES (
            v_creator_id,
            'event_completed',
            'Your Event Completed',
            'Your event "' || v_event_record.title || '" has been completed. Creator fees will be processed soon.',
            jsonb_build_object(
                'event_id', p_event_id,
                'event_title', v_event_record.title,
                'completed_at', NOW()
            )
        );
    END IF;
END;
$$;

-- Update the handle_event_completion function to send notifications
CREATE OR REPLACE FUNCTION handle_event_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_admin_email text;
BEGIN
    -- Only proceed if the event is being marked as completed
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        -- Get the admin email from the current user
        SELECT email INTO v_admin_email
        FROM auth.users
        WHERE id = auth.uid();
        
        -- Set winning_prediction equal to result if the column exists
        BEGIN
            UPDATE events
            SET winning_prediction = result
            WHERE id = NEW.id;
        EXCEPTION WHEN undefined_column THEN
            -- Column doesn't exist yet, just continue
            NULL;
        END;

        -- Send notifications to all participants and creator
        PERFORM send_event_completion_notifications(NEW.id);

        -- Process payouts using the admin email
        PERFORM process_event_payouts(NEW.id, v_admin_email);
    END IF;
    RETURN NEW;
END;
$$;

-- Drop and recreate the trigger
DROP TRIGGER IF EXISTS event_completion_trigger ON events;

CREATE TRIGGER event_completion_trigger
AFTER UPDATE ON events
FOR EACH ROW
WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
EXECUTE FUNCTION handle_event_completion();

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
