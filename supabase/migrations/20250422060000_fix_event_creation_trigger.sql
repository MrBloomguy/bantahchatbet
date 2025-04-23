-- Update the event creation trigger to use platform_fee instead of admin_fee

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS event_pool_creation_trigger ON events;
DROP FUNCTION IF EXISTS create_event_pool_trigger();
DROP FUNCTION IF EXISTS initialize_event_pool(uuid);

-- Create the initialize_event_pool function
CREATE OR REPLACE FUNCTION initialize_event_pool(p_event_id uuid)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_wager_amount numeric;
BEGIN
    -- Get the wager amount from the event
    SELECT wager_amount INTO v_wager_amount
    FROM events
    WHERE id = p_event_id;

    -- Create the event pool with the correct columns
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
        p_event_id,
        0,
        0,
        0,
        0,
        0,
        v_wager_amount,
        0,
        0,
        0,
        0,
        'pending'
    );
END;
$$;

-- Create the trigger function
CREATE OR REPLACE FUNCTION create_event_pool_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    PERFORM initialize_event_pool(NEW.id);
    RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER event_pool_creation_trigger
AFTER INSERT ON events
FOR EACH ROW
EXECUTE FUNCTION create_event_pool_trigger();

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
