-- Add conditional check to create the event_escrow table only if it does not exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_name = 'event_escrow'
    ) THEN
        CREATE TABLE event_escrow (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            event_id UUID REFERENCES events(id) ON DELETE CASCADE,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            amount DECIMAL(10,2) NOT NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'pending_match',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
END $$;

-- Add conditional checks for existing columns
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'event_participants' AND column_name = 'escrow_id'
    ) THEN
        ALTER TABLE event_participants ADD COLUMN escrow_id UUID REFERENCES event_escrow(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'event_participants' AND column_name = 'status'
    ) THEN
        ALTER TABLE event_participants ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'pending_match';
    END IF;
END $$;

-- Create notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create or replace the match_bets_and_update_escrow function
CREATE OR REPLACE FUNCTION match_bets_and_update_escrow() 
RETURNS TRIGGER AS $$
DECLARE
    v_matched_id UUID;
    v_matched_escrow_id UUID;
    v_matched_user_id UUID;
BEGIN
    -- Look for a matching opponent with opposite prediction and lock the row
    SELECT id, escrow_id, user_id
    INTO v_matched_id, v_matched_escrow_id, v_matched_user_id
    FROM event_participants
    WHERE event_id = NEW.event_id
    AND prediction != NEW.prediction
    AND status = 'pending_match'
    AND id != NEW.id
    AND wager_amount = NEW.wager_amount
    ORDER BY created_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED;

    -- If found a match, update both participants
    IF v_matched_id IS NOT NULL THEN
        -- Update the current participant
        UPDATE event_participants
        SET status = 'matched',
            matched_with = v_matched_id,
            matched_at = now()
        WHERE id = NEW.id;

        -- Update the matched participant
        UPDATE event_participants
        SET status = 'matched',
            matched_with = NEW.id,
            matched_at = now()
        WHERE id = v_matched_id;

        -- Update escrow status for both
        UPDATE event_escrow
        SET status = 'matched'
        WHERE id IN (NEW.escrow_id, v_matched_escrow_id);

        -- Create notifications for both participants
        INSERT INTO notifications (user_id, type, message, event_id)
        VALUES 
            (NEW.user_id, 'bet_matched', 'Your bet has been matched with an opponent!', NEW.event_id),
            (v_matched_user_id, 'bet_matched', 'Your bet has been matched with an opponent!', NEW.event_id);
    ELSE
        -- No match found, set status to pending_match
        UPDATE event_participants
        SET status = 'pending_match'
        WHERE id = NEW.id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the existing trigger if it exists
DROP TRIGGER IF EXISTS match_bets_trigger ON public.event_participants;

-- Create trigger for bet matching
CREATE TRIGGER match_bets_trigger
AFTER INSERT ON event_participants
FOR EACH ROW
EXECUTE FUNCTION match_bets_and_update_escrow();

-- Function to process payouts when event is completed
CREATE OR REPLACE FUNCTION process_event_payouts(p_event_id UUID, p_admin_email TEXT)
RETURNS void AS $$
DECLARE
    v_event_result BOOLEAN;
    v_creator_fee_percentage DECIMAL;
    v_creator_id UUID;
BEGIN
    -- Get event result and creator info
    SELECT 
        result,
        creator_fee_percentage,
        creator_id
    INTO 
        v_event_result,
        v_creator_fee_percentage,
        v_creator_id
    FROM events
    WHERE id = p_event_id;

    -- Process matched bets
    WITH matched_pairs AS (
        SELECT 
            a.user_id as user1_id,
            b.user_id as user2_id,
            a.prediction as user1_prediction,
            a.wager_amount,
            a.escrow_id as escrow1_id,
            b.escrow_id as escrow2_id
        FROM event_participants a
        JOIN event_participants b 
        ON a.event_id = b.event_id 
        AND a.status = 'matched' 
        AND b.status = 'matched'
        AND a.prediction != b.prediction
        WHERE a.event_id = p_event_id
    )
    UPDATE event_escrow e
    SET 
        status = CASE 
            WHEN 
                (mp.user1_prediction = v_event_result AND e.id = mp.escrow1_id) OR
                (mp.user1_prediction != v_event_result AND e.id = mp.escrow2_id)
            THEN 'won'
            ELSE 'lost'
        END
    FROM matched_pairs mp
    WHERE e.id IN (mp.escrow1_id, mp.escrow2_id);

    -- Calculate and distribute creator fees
    INSERT INTO creator_earnings (creator_id, event_id, amount)
    SELECT 
        v_creator_id,
        p_event_id,
        SUM(e.amount * v_creator_fee_percentage / 100)
    FROM event_escrow e
    WHERE e.event_id = p_event_id
    AND e.status = 'won'
    GROUP BY v_creator_id, p_event_id;

    -- Create notifications for winners and creator
    INSERT INTO notifications (user_id, type, message, event_id)
    SELECT 
        e.user_id,
        'payout_processed',
        CASE 
            WHEN e.status = 'won' THEN 'Congratulations! You won the bet and your winnings have been credited.'
            ELSE 'Better luck next time! You lost this bet.'
        END,
        p_event_id
    FROM event_escrow e
    WHERE e.event_id = p_event_id;

    -- Notify creator about their earnings
    INSERT INTO notifications (user_id, type, message, event_id)
    SELECT 
        v_creator_id,
        'creator_earnings',
        'Your event has completed and creator fees have been credited to your account.',
        p_event_id;

    -- Log admin action
    INSERT INTO admin_actions (admin_email, action_type, target_type, target_id)
    VALUES (p_admin_email, 'process_payouts', 'event', p_event_id);
END;
$$ LANGUAGE plpgsql;

-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS public.join_event_with_escrow;

-- Recreate the join_event_with_escrow function
CREATE OR REPLACE FUNCTION public.join_event_with_escrow(
    p_event_id UUID,
    p_user_id UUID,
    p_prediction BOOLEAN,
    p_wager_amount NUMERIC
) RETURNS json AS $$
DECLARE
    v_participant_id UUID;
    v_escrow_id UUID;
BEGIN
    -- Start transaction
    BEGIN
        -- Verify entry amount matches pool settings
        IF NOT EXISTS (
            SELECT 1 
            FROM event_pools 
            WHERE event_id = p_event_id 
            AND entry_amount = p_wager_amount
        ) THEN
            RAISE EXCEPTION 'Invalid wager amount';
        END IF;

        -- Check user balance and lock the row
        IF NOT EXISTS (
            SELECT 1 
            FROM profiles 
            WHERE id = p_user_id 
            AND balance >= p_wager_amount 
            FOR UPDATE
        ) THEN
            RAISE EXCEPTION 'Insufficient balance';
        END IF;

        -- Deduct balance
        UPDATE profiles 
        SET balance = balance - p_wager_amount 
        WHERE id = p_user_id;

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

        -- Update pool amounts including yes_amount and no_amount
        UPDATE event_pools
        SET 
            total_amount = total_amount + p_wager_amount,
            yes_amount = CASE WHEN p_prediction THEN yes_amount + p_wager_amount ELSE yes_amount END,
            no_amount = CASE WHEN NOT p_prediction THEN no_amount + p_wager_amount ELSE no_amount END
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