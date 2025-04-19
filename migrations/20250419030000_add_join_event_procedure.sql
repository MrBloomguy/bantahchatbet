-- First add the view for prediction counts
CREATE OR REPLACE VIEW public.event_predictions_summary AS
SELECT 
    event_id,
    COUNT(*) FILTER (WHERE prediction = true) as yes_count,
    COUNT(*) FILTER (WHERE prediction = false) as no_count,
    COUNT(*) as total_participants
FROM public.event_participants
GROUP BY event_id;

-- Grant access to the view
GRANT SELECT ON public.event_predictions_summary TO authenticated;

-- Create or modify event_pools table
CREATE TABLE IF NOT EXISTS public.event_pools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    total_amount NUMERIC DEFAULT 0,
    yes_amount NUMERIC DEFAULT 0,
    no_amount NUMERIC DEFAULT 0,
    entry_amount NUMERIC NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Function to match bets
CREATE OR REPLACE FUNCTION match_bets() RETURNS trigger AS $$
DECLARE
    v_opposing_bet record;
BEGIN
    -- Look for an opposing bet to match with
    SELECT id, user_id, prediction, wager_amount 
    INTO v_opposing_bet
    FROM public.event_participants
    WHERE event_id = NEW.event_id
    AND prediction != NEW.prediction
    AND status = 'pending_match'
    AND id != NEW.id
    AND wager_amount = NEW.wager_amount
    ORDER BY created_at ASC
    LIMIT 1;

    -- If found a match, update both bets
    IF FOUND THEN
        -- Update the current bet
        UPDATE public.event_participants
        SET status = 'matched',
            matched_with = v_opposing_bet.id,
            matched_at = now()
        WHERE id = NEW.id;

        -- Update the opposing bet
        UPDATE public.event_participants
        SET status = 'matched',
            matched_with = NEW.id,
            matched_at = now()
        WHERE id = v_opposing_bet.id;

        -- Update escrow status for both
        UPDATE public.event_escrow
        SET status = 'matched'
        WHERE id IN (
            SELECT escrow_id 
            FROM public.event_participants 
            WHERE id IN (NEW.id, v_opposing_bet.id)
        );

        -- Create notifications for both participants
        INSERT INTO public.notifications (user_id, type, title, content)
        SELECT 
            user_id,
            'bet_matched',
            'Bet Matched!',
            'Your bet has been matched with another player'
        FROM public.event_participants
        WHERE id IN (NEW.id, v_opposing_bet.id);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the existing trigger if it exists
DROP TRIGGER IF EXISTS match_bets_trigger ON public.event_participants;

-- Create trigger for matching
CREATE TRIGGER match_bets_trigger
AFTER INSERT OR UPDATE ON public.event_participants
FOR EACH ROW
WHEN (NEW.status = 'pending_match')
EXECUTE FUNCTION match_bets();

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

        -- Update pool amounts
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

-- Add matched_with column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'event_participants' 
        AND column_name = 'matched_with'
    ) THEN
        ALTER TABLE public.event_participants 
        ADD COLUMN matched_with UUID REFERENCES public.event_participants(id),
        ADD COLUMN matched_at TIMESTAMPTZ;
    END IF;
END $$;

-- Create view for matched bets
CREATE OR REPLACE VIEW public.matched_bets_view AS
SELECT 
    ep1.event_id,
    ep1.id as match_id,
    ep1.user_id as yes_user_id,
    ep2.user_id as no_user_id,
    ep1.wager_amount,
    ep1.matched_at,
    ep1.status
FROM public.event_participants ep1
JOIN public.event_participants ep2 ON ep1.matched_with = ep2.id
WHERE ep1.prediction = true
AND ep1.status = 'matched';

-- Grant access to the view
GRANT SELECT ON public.matched_bets_view TO authenticated;

-- Update the profiles table to set a default balance of 10,000 Naira
ALTER TABLE public.profiles
ALTER COLUMN balance SET DEFAULT 10000;

-- Ensure all existing users have a balance of at least 10,000 Naira
UPDATE public.profiles
SET balance = 10000
WHERE balance IS NULL OR balance < 10000;