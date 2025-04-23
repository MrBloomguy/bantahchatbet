-- Fix notifications table column names and update functions that use them

-- First, ensure the notifications table has consistent column names
DO $$
BEGIN
    -- Check if type column exists but notification_type doesn't
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'notifications'
        AND column_name = 'type'
    ) AND NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'notifications'
        AND column_name = 'notification_type'
    ) THEN
        -- Rename type to notification_type for consistency
        ALTER TABLE public.notifications
        RENAME COLUMN type TO notification_type;
    END IF;

    -- Check if content column doesn't exist but message does
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'notifications'
        AND column_name = 'content'
    ) AND EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'notifications'
        AND column_name = 'message'
    ) THEN
        -- Rename message to content for consistency
        ALTER TABLE public.notifications
        RENAME COLUMN message TO content;
    END IF;

    -- Add notification_type column if neither type nor notification_type exists
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'notifications'
        AND column_name = 'notification_type'
    ) AND NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'notifications'
        AND column_name = 'type'
    ) THEN
        ALTER TABLE public.notifications
        ADD COLUMN notification_type TEXT NOT NULL DEFAULT 'system';
    END IF;

    -- Add content column if neither content nor message exists
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'notifications'
        AND column_name = 'content'
    ) AND NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'notifications'
        AND column_name = 'message'
    ) THEN
        ALTER TABLE public.notifications
        ADD COLUMN content TEXT NOT NULL DEFAULT 'System notification';
    END IF;

    -- Add title column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'notifications'
        AND column_name = 'title'
    ) THEN
        ALTER TABLE public.notifications
        ADD COLUMN title TEXT NOT NULL DEFAULT 'Notification';
    END IF;
END $$;

-- Update any functions that use the old column names

-- Drop and recreate process_event_payouts function if it exists
DROP FUNCTION IF EXISTS process_event_payouts(UUID, TEXT) CASCADE;

-- Create a new version that uses notification_type and content
CREATE OR REPLACE FUNCTION process_event_payouts(p_event_id UUID, p_admin_email TEXT)
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

    -- Get winner prediction from the result field
    v_winner_prediction := v_event_record.result;

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

    -- Create notifications for winners
    BEGIN
        INSERT INTO notifications (
            user_id,
            notification_type,
            title,
            content,
            metadata
        )
        SELECT
            user_id,
            'event_win',
            'Event Payout Processed',
            'Congratulations! You won the event and your winnings have been credited.',
            jsonb_build_object(
                'event_id', p_event_id,
                'amount', v_payout_per_winner,
                'processed_at', NOW()
            )
        FROM event_participants
        WHERE event_id = p_event_id
        AND prediction = v_winner_prediction;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error creating winner notifications: %', SQLERRM;
    END;

    -- Notify creator about their earnings if applicable
    IF v_creator_fee > 0 AND v_creator_id IS NOT NULL THEN
        BEGIN
            INSERT INTO notifications (
                user_id,
                notification_type,
                title,
                content,
                metadata
            ) VALUES (
                v_creator_id,
                'creator_earnings',
                'Creator Earnings Processed',
                'Your event has completed and creator fees have been credited to your account.',
                jsonb_build_object(
                    'event_id', p_event_id,
                    'amount', v_creator_fee,
                    'processed_at', NOW()
                )
            );
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Error creating creator notification: %', SQLERRM;
        END;
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
