-- Create function to process event payouts with admin check
CREATE OR REPLACE FUNCTION process_event_payouts(
    p_event_id UUID,
    p_admin_email TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if the user is an admin
    IF NOT EXISTS (
        SELECT 1 FROM auth.users 
        WHERE email = p_admin_email 
        AND raw_user_meta_data->>'is_admin' = 'true'
    ) THEN
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
            admin_fee,
            winning_pool,
            losing_pool
        FROM event_pools
        WHERE event_id = p_event_id
    ),
    winners AS (
        SELECT 
            ep.user_id,
            w.id as wallet_id,
            ep.wager_amount,
            (ep.wager_amount::float / NULLIF(p.winning_pool, 0) * (p.total_amount - p.admin_fee))::integer as payout_amount
        FROM event_participants ep
        JOIN pool_info p ON true
        JOIN wallets w ON w.user_id = ep.user_id
        WHERE ep.event_id = p_event_id
        AND ep.prediction = true
        AND ep.status = 'accepted'
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
        payout_amount,
        'completed',
        jsonb_build_object(
            'event_id', p_event_id,
            'wager_amount', wager_amount,
            'processed_by', p_admin_email,
            'processed_at', NOW()
        )
    FROM winners
    WHERE payout_amount > 0;

    -- Update wallets with winnings
    UPDATE wallets w
    SET balance = balance + t.payout_amount
    FROM (
        SELECT wallet_id, sum(payout_amount) as payout_amount
        FROM winners
        GROUP BY wallet_id
    ) t
    WHERE w.id = t.wallet_id;

    -- Mark event as processed
    UPDATE events
    SET payouts_processed = true,
        updated_at = NOW()
    WHERE id = p_event_id;

    -- Create admin action record
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
            'processed_at', NOW()
        )
    );
END;
$$;