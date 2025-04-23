-- Fix the process_event_payouts function to handle creator earnings properly

-- Drop existing function
DROP FUNCTION IF EXISTS process_event_payouts(uuid, text) CASCADE;

-- Create updated function
CREATE OR REPLACE FUNCTION process_event_payouts(
    p_event_id UUID,
    p_admin_email TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_event_record record;
    v_winner_prediction boolean;
    v_total_pool numeric;
    v_winner_count int;
    v_payout_per_winner numeric;
    v_creator_id uuid;
    v_creator_fee_percentage numeric;
    v_creator_fee numeric;
BEGIN
    -- Get event details
    SELECT * INTO v_event_record
    FROM events
    WHERE id = p_event_id;

    IF v_event_record.status != 'completed' THEN
        RAISE EXCEPTION 'Event must be completed before processing payouts';
    END IF;

    IF v_event_record.payouts_processed THEN
        RAISE EXCEPTION 'Payouts have already been processed for this event';
    END IF;

    -- Get creator info
    v_creator_id := v_event_record.creator_id;
    v_creator_fee_percentage := COALESCE(v_event_record.creator_fee_percentage, 0);

    -- Get winner prediction (default to the result field if winning_prediction is not set)
    v_winner_prediction := COALESCE(v_event_record.winning_prediction, v_event_record.result);

    -- Get pool info
    SELECT 
        ep.total_amount,
        COUNT(CASE WHEN ep2.prediction = v_winner_prediction THEN 1 END)
    INTO 
        v_total_pool,
        v_winner_count
    FROM 
        event_pools ep
    LEFT JOIN 
        event_participants ep2 ON ep2.event_id = p_event_id
    WHERE 
        ep.event_id = p_event_id
    GROUP BY 
        ep.total_amount;

    -- If no winners, exit early
    IF v_winner_count = 0 THEN
        -- Mark event as processed
        UPDATE events
        SET payouts_processed = true,
            updated_at = NOW()
        WHERE id = p_event_id;
        
        RETURN;
    END IF;

    -- Calculate creator fee
    v_creator_fee := (v_total_pool * v_creator_fee_percentage / 100);

    -- Calculate payout per winner
    -- Platform fee is already deducted in the event_pools table
    v_payout_per_winner := (v_total_pool - v_creator_fee) / v_winner_count;

    -- Process payouts to winners
    WITH winners AS (
        SELECT 
            ep.user_id,
            w.id as wallet_id
        FROM 
            event_participants ep
        JOIN 
            wallets w ON w.user_id = ep.user_id
        WHERE 
            ep.event_id = p_event_id
        AND 
            ep.prediction = v_winner_prediction
    )
    INSERT INTO transactions (
        wallet_id,
        user_id,
        type,
        amount,
        status,
        metadata
    )
    SELECT 
        wallet_id,
        user_id,
        'event_win',
        v_payout_per_winner,
        'completed',
        jsonb_build_object(
            'event_id', p_event_id,
            'processed_by', p_admin_email,
            'processed_at', NOW()
        )
    FROM winners;

    -- Update wallets with winnings
    UPDATE wallets w
    SET balance = balance + v_payout_per_winner
    FROM (
        SELECT user_id
        FROM event_participants
        WHERE event_id = p_event_id
        AND prediction = v_winner_prediction
    ) winners
    WHERE w.user_id = winners.user_id;

    -- Process creator fee if applicable
    IF v_creator_fee > 0 AND v_creator_id IS NOT NULL THEN
        -- Try to insert into creator_earnings if the table exists
        BEGIN
            INSERT INTO creator_earnings (
                creator_id,
                event_id,
                amount,
                status
            ) VALUES (
                v_creator_id,
                p_event_id,
                v_creator_fee,
                'processed'
            );
        EXCEPTION WHEN undefined_table THEN
            -- Table doesn't exist yet, just log it
            RAISE NOTICE 'creator_earnings table does not exist, skipping creator fee';
        END;

        -- Update creator wallet
        UPDATE wallets
        SET balance = balance + v_creator_fee
        WHERE user_id = v_creator_id;

        -- Record transaction
        INSERT INTO transactions (
            wallet_id,
            user_id,
            type,
            amount,
            status,
            metadata
        )
        SELECT 
            id,
            user_id,
            'creator_fee',
            v_creator_fee,
            'completed',
            jsonb_build_object(
                'event_id', p_event_id,
                'processed_by', p_admin_email,
                'processed_at', NOW()
            )
        FROM wallets
        WHERE user_id = v_creator_id;
    END IF;

    -- Mark event as processed
    UPDATE events
    SET payouts_processed = true,
        updated_at = NOW()
    WHERE id = p_event_id;

    -- Log admin action
    INSERT INTO admin_actions (
        admin_email,
        action_type,
        target_type,
        target_id,
        details
    ) VALUES (
        p_admin_email,
        'process_payouts',
        'event',
        p_event_id,
        jsonb_build_object(
            'total_pool', v_total_pool,
            'winner_count', v_winner_count,
            'payout_per_winner', v_payout_per_winner,
            'creator_fee', v_creator_fee,
            'processed_at', NOW()
        )
    );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION process_event_payouts(uuid, text) TO authenticated;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
