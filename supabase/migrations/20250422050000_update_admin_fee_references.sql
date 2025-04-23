-- Update functions that reference admin_fee to use platform_fee instead

-- Update the distribute_event_winnings function
CREATE OR REPLACE FUNCTION distribute_event_winnings(p_event_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total_pool integer;
    v_platform_fee integer;
    v_winning_prediction boolean;
    v_winner_count integer;
    v_payout_per_winner integer;
BEGIN
    -- Get event pool details
    SELECT total_amount, platform_fee
    INTO v_total_pool, v_platform_fee
    FROM event_pools
    WHERE event_id = p_event_id;

    -- Get winning prediction from completed event
    SELECT winning_prediction INTO v_winning_prediction
    FROM events
    WHERE id = p_event_id AND status = 'completed';

    -- Count winners
    SELECT COUNT(*) INTO v_winner_count
    FROM event_participants
    WHERE event_id = p_event_id
    AND prediction = v_winning_prediction;

    -- Calculate payout per winner (total pool minus platform fee, divided by winners)
    v_payout_per_winner := (v_total_pool - v_platform_fee) / v_winner_count;

    -- Distribute to winners
    INSERT INTO event_payouts (event_id, user_id, amount, status)
    SELECT
        p_event_id,
        user_id,
        v_payout_per_winner,
        'processed'
    FROM event_participants
    WHERE event_id = p_event_id
    AND prediction = v_winning_prediction;

    -- Update winner wallets
    UPDATE wallets w
    SET balance = balance + v_payout_per_winner
    FROM event_participants ep
    WHERE ep.event_id = p_event_id
    AND ep.prediction = v_winning_prediction
    AND ep.user_id = w.user_id;

    -- Collect platform fee
    PERFORM collect_admin_fee(p_event_id);
END;
$$;

-- Check if process_payouts function exists and drop it if it does
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'process_payouts') THEN
        DROP FUNCTION IF EXISTS process_payouts(uuid, text);
    END IF;
END $$;

-- Create the updated process_payouts function
CREATE OR REPLACE FUNCTION process_payouts(p_event_id uuid, p_admin_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if the user is an admin using the is_admin function
    IF NOT is_admin(p_admin_email) THEN
        RAISE EXCEPTION 'Only admins can process payouts';
    END IF;

    -- Get event details and verify it's completed and not already processed
    IF NOT EXISTS (
        SELECT 1 FROM events
        WHERE id = p_event_id
        AND status = 'completed'
        AND NOT payouts_processed
    ) THEN
        RAISE EXCEPTION 'Event must be completed and not already processed';
    END IF;

    -- Process payouts
    WITH pool_info AS (
        SELECT
            total_amount,
            platform_fee,
            winning_pool,
            losing_pool
        FROM event_pools
        WHERE event_id = p_event_id
    ),
    winner_info AS (
        SELECT
            user_id,
            prediction
        FROM event_participants
        WHERE event_id = p_event_id
        AND prediction = (SELECT winning_prediction FROM events WHERE id = p_event_id)
    )
    UPDATE wallets w
    SET balance = balance + (
        (SELECT (total_amount - platform_fee) FROM pool_info) /
        (SELECT COUNT(*) FROM winner_info)
    )
    FROM winner_info
    WHERE w.user_id = winner_info.user_id;

    -- Mark event as processed
    UPDATE events
    SET payouts_processed = true
    WHERE id = p_event_id;

    -- Collect platform fee
    PERFORM collect_admin_fee(p_event_id);
END;
$$;

-- Drop the existing calculate_pool_fees function first
DROP FUNCTION IF EXISTS calculate_pool_fees(DECIMAL, DECIMAL) CASCADE;

-- Recreate the calculate_pool_fees function with platform_fee instead of admin_fee
CREATE FUNCTION calculate_pool_fees(
    amount DECIMAL,
    creator_fee_pct DECIMAL
) RETURNS TABLE (
    net_amount DECIMAL,
    platform_fee DECIMAL,
    creator_fee DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        amount * (1 - 0.03 - creator_fee_pct/100)::DECIMAL as net_amount,
        amount * 0.03::DECIMAL as platform_fee,
        amount * (creator_fee_pct/100)::DECIMAL as creator_fee;
END;
$$ LANGUAGE plpgsql;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
