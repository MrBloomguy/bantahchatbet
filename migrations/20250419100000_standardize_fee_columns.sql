-- Update event_pools table to ensure consistent column names
DO $$ 
BEGIN
    -- Rename admin_fee to platform_fee if it exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'event_pools' 
        AND column_name = 'admin_fee'
    ) THEN
        ALTER TABLE event_pools RENAME COLUMN admin_fee TO platform_fee;
    END IF;

    -- Add platform_fee if neither exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'event_pools' 
        AND column_name IN ('platform_fee', 'admin_fee')
    ) THEN
        ALTER TABLE event_pools ADD COLUMN platform_fee NUMERIC DEFAULT 0;
    END IF;

    -- Add creator_fee if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'event_pools' 
        AND column_name = 'creator_fee'
    ) THEN
        ALTER TABLE event_pools ADD COLUMN creator_fee NUMERIC DEFAULT 0;
    END IF;

    -- Add yes_pool if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'event_pools' 
        AND column_name = 'yes_pool'
    ) THEN
        ALTER TABLE event_pools ADD COLUMN yes_pool NUMERIC DEFAULT 0;
    END IF;

    -- Add no_pool if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'event_pools' 
        AND column_name = 'no_pool'
    ) THEN
        ALTER TABLE event_pools ADD COLUMN no_pool NUMERIC DEFAULT 0;
    END IF;
END $$;

-- Drop and recreate join_event_with_escrow function to use new column names
CREATE OR REPLACE FUNCTION public.join_event_with_escrow(
    p_event_id UUID,
    p_user_id UUID,
    p_prediction BOOLEAN,
    p_wager_amount NUMERIC
) RETURNS json AS $$
DECLARE
    v_participant_id UUID;
    v_escrow_id UUID;
    v_fees record;
BEGIN
    -- Start transaction
    BEGIN
        -- Get fees
        SELECT * INTO v_fees FROM calculate_pool_fees(p_wager_amount, e.creator_fee_percentage)
        FROM events e WHERE e.id = p_event_id;

        -- Create escrow entry
        INSERT INTO event_escrow (
            event_id,
            user_id,
            amount,
            status
        ) VALUES (
            p_event_id,
            p_user_id,
            p_wager_amount,
            'pending_match'
        ) RETURNING id INTO v_escrow_id;

        -- Create participant entry
        INSERT INTO event_participants (
            event_id,
            user_id,
            prediction,
            wager_amount,
            status,
            escrow_id
        ) VALUES (
            p_event_id,
            p_user_id,
            p_prediction,
            p_wager_amount,
            'pending_match',
            v_escrow_id
        ) RETURNING id INTO v_participant_id;

        -- Update pool amounts
        UPDATE event_pools
        SET 
            total_amount = total_amount + p_wager_amount,
            platform_fee = platform_fee + v_fees.platform_fee,
            creator_fee = creator_fee + v_fees.creator_fee,
            yes_pool = CASE WHEN p_prediction THEN yes_pool + v_fees.net_amount ELSE yes_pool END,
            no_pool = CASE WHEN NOT p_prediction THEN no_pool + v_fees.net_amount ELSE no_pool END
        WHERE event_id = p_event_id;

        -- Return the created IDs
        RETURN json_build_object(
            'participant_id', v_participant_id,
            'escrow_id', v_escrow_id
        );
    EXCEPTION WHEN OTHERS THEN
        -- Rollback will happen automatically
        RAISE;
    END;
END;
$$ LANGUAGE plpgsql;