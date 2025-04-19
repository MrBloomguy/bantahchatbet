-- Add creator_fee column to events table
ALTER TABLE public.events 
ADD COLUMN creator_fee_percentage DECIMAL DEFAULT 2.0; -- 2% default creator fee

-- Create bet_matches table
CREATE TABLE IF NOT EXISTS public.bet_matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    yes_participant_id UUID NOT NULL REFERENCES public.event_participants(id),
    no_participant_id UUID NOT NULL REFERENCES public.event_participants(id),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'matched', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add match_id to event_participants
ALTER TABLE public.event_participants 
ADD COLUMN match_id UUID REFERENCES public.bet_matches(id);

-- Create function to match bets
CREATE OR REPLACE FUNCTION match_event_bets() RETURNS trigger AS $$
BEGIN
    -- Find opposing bet to match with
    WITH potential_match AS (
        SELECT id, user_id, prediction, wager_amount
        FROM public.event_participants
        WHERE event_id = NEW.event_id
        AND match_id IS NULL
        AND prediction != NEW.prediction
        AND status = 'active'
        LIMIT 1
    )
    INSERT INTO public.bet_matches (event_id, yes_participant_id, no_participant_id)
    SELECT 
        NEW.event_id,
        CASE WHEN NEW.prediction THEN NEW.id ELSE pm.id END,
        CASE WHEN NEW.prediction THEN pm.id ELSE NEW.id END
    FROM potential_match pm
    WHERE pm.id IS NOT NULL
    RETURNING id INTO NEW.match_id;

    -- Update the matching participant's match_id if a match was found
    IF NEW.match_id IS NOT NULL THEN
        UPDATE public.event_participants
        SET match_id = NEW.match_id
        WHERE id IN (
            SELECT CASE WHEN NEW.prediction THEN no_participant_id ELSE yes_participant_id END
            FROM public.bet_matches
            WHERE id = NEW.match_id
        );

        -- Create notifications for both participants
        INSERT INTO public.notifications (user_id, type, title, content, metadata)
        SELECT 
            ep.user_id,
            'bet_matched',
            'Bet Matched!',
            'Your prediction has been matched with another player',
            jsonb_build_object(
                'event_id', NEW.event_id,
                'match_id', NEW.match_id,
                'opponent_id', opp.user_id
            )
        FROM public.event_participants ep
        CROSS JOIN public.event_participants opp
        WHERE ep.match_id = NEW.match_id
        AND opp.match_id = NEW.match_id
        AND ep.id != opp.id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for matching
CREATE TRIGGER match_bets_trigger
AFTER INSERT ON public.event_participants
FOR EACH ROW
EXECUTE FUNCTION match_event_bets();

-- Create view for matched bets
CREATE VIEW public.matched_bets_view AS
SELECT 
    bm.id as match_id,
    bm.event_id,
    e.title as event_title,
    yes_p.user_id as yes_user_id,
    no_p.user_id as no_user_id,
    yes_p.wager_amount,
    bm.status,
    bm.created_at as matched_at
FROM public.bet_matches bm
JOIN public.events e ON bm.event_id = e.id
JOIN public.event_participants yes_p ON bm.yes_participant_id = yes_p.id
JOIN public.event_participants no_p ON bm.no_participant_id = no_p.id;

-- Update pool calculation to include creator fee
CREATE OR REPLACE FUNCTION calculate_pool_fees(
    amount DECIMAL,
    creator_fee_pct DECIMAL
) RETURNS TABLE (
    net_amount DECIMAL,
    admin_fee DECIMAL,
    creator_fee DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        amount * (1 - 0.03 - creator_fee_pct/100)::DECIMAL as net_amount,
        amount * 0.03::DECIMAL as admin_fee,
        amount * (creator_fee_pct/100)::DECIMAL as creator_fee;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT SELECT ON public.matched_bets_view TO authenticated;
GRANT SELECT, REFERENCES ON public.bet_matches TO authenticated;