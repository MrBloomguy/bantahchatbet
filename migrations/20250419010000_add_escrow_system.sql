-- Create escrow table
CREATE TABLE event_escrow (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending_match',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add escrow_id to event_participants
ALTER TABLE event_participants ADD COLUMN escrow_id UUID REFERENCES event_escrow(id) ON DELETE SET NULL;
ALTER TABLE event_participants ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'pending_match';

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

-- Create function to match bets and update escrow
CREATE OR REPLACE FUNCTION match_bets_and_update_escrow() 
RETURNS TRIGGER AS $$
BEGIN
    -- Look for a matching opponent with opposite prediction
    WITH potential_match AS (
        SELECT 
            ep.id,
            ep.user_id,
            ep.wager_amount,
            ep.prediction,
            ep.escrow_id
        FROM event_participants ep
        WHERE ep.event_id = NEW.event_id
        AND ep.prediction != NEW.prediction
        AND ep.status = 'pending_match'
        AND ep.id != NEW.id
        AND ep.wager_amount = NEW.wager_amount
        LIMIT 1
        FOR UPDATE SKIP LOCKED
    ),
    match_update AS (
        UPDATE event_participants
        SET status = 'matched'
        FROM potential_match
        WHERE event_participants.id = potential_match.id
        RETURNING potential_match.*
    )
    UPDATE event_participants
    SET status = CASE 
        WHEN EXISTS (SELECT 1 FROM match_update) THEN 'matched'
        ELSE 'pending_match'
    END
    WHERE id = NEW.id;

    -- If match found, update escrow status and create notifications
    IF EXISTS (SELECT 1 FROM match_update) THEN
        -- Update escrow status for both participants
        UPDATE event_escrow
        SET status = 'matched'
        WHERE id IN (
            (SELECT escrow_id FROM match_update),
            NEW.escrow_id
        );

        -- Notify both participants
        INSERT INTO notifications (user_id, type, message, event_id)
        VALUES 
        (NEW.user_id, 'bet_matched', 'Your bet has been matched with an opponent!', NEW.event_id),
        ((SELECT user_id FROM match_update), 'bet_matched', 'Your bet has been matched with an opponent!', NEW.event_id);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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