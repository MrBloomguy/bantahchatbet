-- Create escrow table
CREATE TABLE event_escrow (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id),
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending_match',
    matched_with UUID REFERENCES event_escrow(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add index for faster matching queries
CREATE INDEX idx_escrow_matching ON event_escrow(event_id, status, amount);

-- Create function to match bets
CREATE OR REPLACE FUNCTION match_bets() 
RETURNS TRIGGER AS $$
BEGIN
    -- Try to find a matching bet with opposite prediction
    WITH matched AS (
        SELECT e.id as escrow_id, e.user_id
        FROM event_escrow e
        JOIN event_participants ep ON ep.user_id = e.user_id AND ep.event_id = e.event_id
        WHERE e.event_id = NEW.event_id 
        AND e.status = 'pending_match'
        AND e.amount = NEW.amount
        AND e.id != NEW.id
        AND ep.prediction != (
            SELECT prediction 
            FROM event_participants 
            WHERE user_id = NEW.user_id AND event_id = NEW.event_id
        )
        LIMIT 1
        FOR UPDATE SKIP LOCKED
    )
    UPDATE event_escrow e
    SET status = 'matched',
        matched_with = CASE 
            WHEN e.id = NEW.id THEN matched.escrow_id
            ELSE NEW.id
        END,
        updated_at = CURRENT_TIMESTAMP
    FROM matched
    WHERE e.id = NEW.id OR e.id = matched.escrow_id;

    -- Create notifications for both users
    IF NEW.status = 'matched' THEN
        INSERT INTO notifications (user_id, type, message, event_id)
        VALUES 
            (NEW.user_id, 'bet_matched', 'Your bet has been matched! The event is now locked.', NEW.event_id),
            ((SELECT user_id FROM event_escrow WHERE id = NEW.matched_with), 
             'bet_matched', 'Your bet has been matched! The event is now locked.', NEW.event_id);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for bet matching
CREATE TRIGGER match_bets_trigger
AFTER INSERT OR UPDATE ON event_escrow
FOR EACH ROW
WHEN (NEW.status = 'pending_match')
EXECUTE FUNCTION match_bets();

-- Create function to process payouts
CREATE OR REPLACE FUNCTION process_event_payouts(event_id UUID)
RETURNS VOID AS $$
DECLARE
    event_result BOOLEAN;
BEGIN
    -- Get event result
    SELECT result INTO event_result
    FROM events
    WHERE id = event_id AND status = 'completed';

    -- Process matched bets
    WITH winning_bets AS (
        SELECT 
            e.id,
            e.user_id,
            e.amount * 2 as payout_amount
        FROM event_escrow e
        JOIN event_participants ep ON ep.user_id = e.user_id AND ep.event_id = e.event_id
        WHERE e.event_id = event_id
        AND e.status = 'matched'
        AND ep.prediction = event_result
    )
    UPDATE profiles p
    SET balance = p.balance + wb.payout_amount
    FROM winning_bets wb
    WHERE p.id = wb.user_id;

    -- Create payout notifications
    INSERT INTO notifications (user_id, type, message, event_id)
    SELECT 
        user_id,
        'payout_processed',
        CASE 
            WHEN amount > 0 THEN 'Congratulations! You won ' || amount::text || ' points!'
            ELSE 'Better luck next time! You lost your bet.'
        END,
        event_id
    FROM winning_bets;

    -- Update escrow status to completed
    UPDATE event_escrow
    SET status = 'completed',
        updated_at = CURRENT_TIMESTAMP
    WHERE event_id = event_id;
END;
$$ LANGUAGE plpgsql;