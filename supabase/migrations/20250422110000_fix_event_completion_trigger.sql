-- Fix the event completion trigger to resolve ambiguous column reference

-- Drop existing triggers
DROP TRIGGER IF EXISTS event_changes_trigger ON events;
DROP TRIGGER IF EXISTS event_completion_trigger ON events;

-- Drop existing functions
DROP FUNCTION IF EXISTS handle_event_changes() CASCADE;
DROP FUNCTION IF EXISTS handle_event_completion() CASCADE;
DROP FUNCTION IF EXISTS process_event_payout(uuid) CASCADE;

-- Create a new function to handle event completion
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

        -- Process payouts using the admin email
        PERFORM process_event_payouts(NEW.id, v_admin_email);
    END IF;
    RETURN NEW;
END;
$$;

-- Create a new trigger for event completion
CREATE TRIGGER event_completion_trigger
AFTER UPDATE ON events
FOR EACH ROW
WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
EXECUTE FUNCTION handle_event_completion();

-- Create a new function to handle event changes
CREATE OR REPLACE FUNCTION handle_event_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- For new events
  IF (TG_OP = 'INSERT') THEN
    -- Initialize event pool
    INSERT INTO event_pools (
      event_id,
      total_amount,
      platform_fee,
      creator_fee,
      yes_pool,
      no_pool,
      entry_amount,
      yes_amount,
      no_amount,
      winning_pool,
      losing_pool,
      status
    ) VALUES (
      NEW.id,
      0,
      0,
      0,
      0,
      0,
      NEW.wager_amount,
      0,
      0,
      0,
      0,
      'pending'
    );
    RETURN NEW;

  -- For updated events
  ELSIF (TG_OP = 'UPDATE') THEN
    -- Handle status changes for cancellation
    -- (completion is handled by event_completion_trigger)
    IF NEW.status != OLD.status AND NEW.status = 'cancelled' THEN
      -- If event is cancelled, handle refunds
      PERFORM cancel_event(NEW.id);
    END IF;

    RETURN NEW;

  -- For deleted events
  ELSIF (TG_OP = 'DELETE') THEN
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a new trigger for general event changes
CREATE TRIGGER event_changes_trigger
AFTER INSERT OR UPDATE OR DELETE ON events
FOR EACH ROW
EXECUTE FUNCTION handle_event_changes();

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
