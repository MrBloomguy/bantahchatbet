-- Add event and challenge transaction types to the transactions table
BEGIN;

-- First, check if the transactions table has a type constraint
DO $$
DECLARE
    constraint_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'transactions_type_check'
        AND table_name = 'transactions'
    ) INTO constraint_exists;

    -- If constraint exists, drop it
    IF constraint_exists THEN
        EXECUTE 'ALTER TABLE transactions DROP CONSTRAINT transactions_type_check';
    END IF;
END $$;

-- Add new transaction types for events and challenges
ALTER TABLE transactions
ADD CONSTRAINT transactions_type_check
CHECK (type IN (
    'deposit', 
    'withdrawal', 
    'transfer', 
    'event_win', 
    'event_loss', 
    'challenge_win', 
    'challenge_loss', 
    'bet_win', 
    'bet_loss', 
    'bet_lock', 
    'bet_refund',
    'event_join'
));

-- Create function to handle event completion and generate transactions
CREATE OR REPLACE FUNCTION handle_event_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_admin_email text;
    v_event_record record;
    v_winner_prediction boolean;
    v_total_pool numeric;
    v_winner_count int;
    v_payout_per_winner numeric;
    v_creator_id uuid;
    v_creator_fee_percentage numeric;
    v_creator_fee numeric;
BEGIN
    -- Only proceed if the event is being marked as completed
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        -- Get the admin email from the current user
        SELECT email INTO v_admin_email
        FROM auth.users
        WHERE id = auth.uid();

        -- Set winning_prediction equal to result if the column exists
        BEGIN
            UPDATE events
            SET winning_prediction = result
            WHERE id = NEW.id;
        EXCEPTION WHEN undefined_column THEN
            -- Column doesn't exist yet, just continue
            NULL;
        END;

        -- Get event details
        SELECT * INTO v_event_record
        FROM events
        WHERE id = NEW.id;

        -- Get the winning prediction
        v_winner_prediction := v_event_record.result;

        -- Get event pool details
        SELECT 
            total_amount,
            creator_id,
            COALESCE(creator_fee_percentage, 5) -- Default to 5% if not set
        INTO 
            v_total_pool,
            v_creator_id,
            v_creator_fee_percentage
        FROM 
            event_pools
        WHERE 
            event_id = NEW.id;

        -- Count winners
        SELECT COUNT(*) INTO v_winner_count
        FROM event_participants
        WHERE event_id = NEW.id
        AND prediction = v_winner_prediction;

        -- Send notifications to all participants and creator
        PERFORM send_event_completion_notifications(NEW.id);

        -- Process payouts using the admin email
        PERFORM process_event_payouts(NEW.id, v_admin_email);
        
        -- Create loss transactions for losers
        WITH losers AS (
            SELECT
                ep.user_id,
                w.id as wallet_id,
                e.wager_amount as amount,
                e.title as event_title
            FROM
                event_participants ep
            JOIN
                wallets w ON w.user_id = ep.user_id
            JOIN
                events e ON e.id = ep.event_id
            WHERE
                ep.event_id = NEW.id
            AND
                ep.prediction != v_winner_prediction
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
            'event_loss',
            amount,
            'completed',
            jsonb_build_object(
                'event_id', NEW.id,
                'event_title', event_title,
                'processed_at', NOW()
            )
        FROM losers;
    END IF;
    RETURN NEW;
END;
$$;

-- Drop and recreate the trigger
DROP TRIGGER IF EXISTS event_completion_trigger ON events;

CREATE TRIGGER event_completion_trigger
AFTER UPDATE ON events
FOR EACH ROW
WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
EXECUTE FUNCTION handle_event_completion();

-- Create function to handle challenge completion and generate transactions
CREATE OR REPLACE FUNCTION handle_challenge_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_admin_email text;
    v_loser_id uuid;
    v_loser_wallet_id uuid;
    v_challenge_title text;
BEGIN
    -- Only proceed if the challenge is being marked as completed
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        -- Get the admin email from the current user
        SELECT email INTO v_admin_email
        FROM auth.users
        WHERE id = auth.uid();

        -- Determine the loser
        IF NEW.winner_id = NEW.challenger_id THEN
            v_loser_id := NEW.challenged_id;
        ELSE
            v_loser_id := NEW.challenger_id;
        END IF;

        -- Get loser's wallet ID
        SELECT id INTO v_loser_wallet_id
        FROM wallets
        WHERE user_id = v_loser_id;
        
        -- Get challenge title or game type
        v_challenge_title := COALESCE(NEW.title, NEW.game_type);

        -- Create loss transaction for loser
        IF v_loser_wallet_id IS NOT NULL THEN
            INSERT INTO transactions (
                wallet_id,
                user_id,
                type,
                amount,
                status,
                metadata
            ) VALUES (
                v_loser_wallet_id,
                v_loser_id,
                'challenge_loss',
                NEW.amount,
                'completed',
                jsonb_build_object(
                    'challenge_id', NEW.id,
                    'challenge_title', v_challenge_title,
                    'processed_at', NOW()
                )
            );
        END IF;

        -- Send notifications to participants
        PERFORM send_challenge_settlement_notifications(NEW.id);

        -- Process payouts using the admin email
        PERFORM process_challenge_payouts(NEW.id, v_admin_email);
    END IF;
    RETURN NEW;
END;
$$;

-- Drop and recreate the trigger
DROP TRIGGER IF EXISTS challenge_completion_trigger ON challenges;

CREATE TRIGGER challenge_completion_trigger
AFTER UPDATE ON challenges
FOR EACH ROW
WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
EXECUTE FUNCTION handle_challenge_completion();

-- Update process_event_payouts function to include event title in metadata
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

    -- Get the winning prediction
    v_winner_prediction := v_event_record.result;
    IF v_winner_prediction IS NULL THEN
        RAISE EXCEPTION 'Event result must be set before processing payouts';
    END IF;

    -- Get event pool details
    SELECT 
        total_amount,
        creator_id,
        COALESCE(creator_fee_percentage, 5) -- Default to 5% if not set
    INTO 
        v_total_pool,
        v_creator_id,
        v_creator_fee_percentage
    FROM 
        event_pools
    WHERE 
        event_id = p_event_id;

    -- Count winners
    SELECT COUNT(*) INTO v_winner_count
    FROM event_participants
    WHERE event_id = p_event_id
    AND prediction = v_winner_prediction;

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
            'event_title', v_event_record.title,
            'processed_by', p_admin_email,
            'processed_at', NOW()
        )
    FROM winners;

    -- Update wallets with winnings
    UPDATE wallets w
    SET balance = balance + v_payout_per_winner
    FROM (
        SELECT wallet_id
        FROM winners
    ) t
    WHERE w.id = t.wallet_id;

    -- Process creator fee if applicable
    IF v_creator_id IS NOT NULL AND v_creator_fee > 0 THEN
        -- Get creator wallet
        DECLARE
            v_creator_wallet_id UUID;
        BEGIN
            SELECT id INTO v_creator_wallet_id
            FROM wallets
            WHERE user_id = v_creator_id;

            IF v_creator_wallet_id IS NOT NULL THEN
                -- Update creator wallet
                UPDATE wallets
                SET balance = balance + v_creator_fee
                WHERE id = v_creator_wallet_id;

                -- Record creator fee transaction
                INSERT INTO transactions (
                    wallet_id,
                    user_id,
                    type,
                    amount,
                    status,
                    metadata
                ) VALUES (
                    v_creator_wallet_id,
                    v_creator_id,
                    'event_win',
                    v_creator_fee,
                    'completed',
                    jsonb_build_object(
                        'event_id', p_event_id,
                        'event_title', v_event_record.title,
                        'fee_type', 'creator_fee',
                        'processed_by', p_admin_email,
                        'processed_at', NOW()
                    )
                );
            END IF;
        END;
    END IF;

    -- Mark event as processed
    UPDATE events
    SET payouts_processed = true,
        updated_at = NOW()
    WHERE id = p_event_id;
END;
$$;

-- Update process_challenge_payouts function to include challenge title in metadata
CREATE OR REPLACE FUNCTION process_challenge_payouts(
    p_challenge_id UUID,
    p_admin_email TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_challenge_record record;
    v_winner_id UUID;
    v_winner_wallet_id UUID;
    v_wager_amount numeric;
    v_platform_fee numeric;
    v_winner_payout numeric;
    v_challenge_title text;
BEGIN
    -- Get challenge details
    SELECT * INTO v_challenge_record
    FROM challenges
    WHERE id = p_challenge_id;

    IF v_challenge_record.status != 'completed' THEN
        RAISE EXCEPTION 'Challenge must be completed before processing payouts';
    END IF;

    IF v_challenge_record.payouts_processed THEN
        RAISE EXCEPTION 'Payouts have already been processed for this challenge';
    END IF;

    -- Get winner ID
    v_winner_id := v_challenge_record.winner_id;
    IF v_winner_id IS NULL THEN
        RAISE EXCEPTION 'Winner must be set before processing payouts';
    END IF;

    -- Get winner wallet ID
    SELECT id INTO v_winner_wallet_id
    FROM wallets
    WHERE user_id = v_winner_id;

    IF v_winner_wallet_id IS NULL THEN
        RAISE EXCEPTION 'Winner wallet not found';
    END IF;

    -- Get wager amount
    v_wager_amount := v_challenge_record.amount;
    
    -- Get challenge title or game type
    v_challenge_title := COALESCE(v_challenge_record.title, v_challenge_record.game_type);

    -- Calculate platform fee (5%)
    v_platform_fee := v_wager_amount * 0.05;

    -- Calculate winner payout
    v_winner_payout := (v_wager_amount * 2) - v_platform_fee;

    -- Process payout to winner
    IF v_winner_wallet_id IS NOT NULL THEN
        -- Update wallet balance
        UPDATE wallets
        SET balance = balance + v_winner_payout
        WHERE id = v_winner_wallet_id;

        -- Record transaction
        INSERT INTO transactions (
            wallet_id,
            user_id,
            type,
            amount,
            status,
            metadata
        ) VALUES (
            v_winner_wallet_id,
            v_winner_id,
            'challenge_win',
            v_winner_payout,
            'completed',
            jsonb_build_object(
                'challenge_id', p_challenge_id,
                'challenge_title', v_challenge_title,
                'wager_amount', v_wager_amount,
                'platform_fee', v_platform_fee,
                'processed_by', p_admin_email,
                'processed_at', NOW()
            )
        );
    END IF;

    -- Mark challenge as processed
    UPDATE challenges
    SET payouts_processed = true,
        updated_at = NOW()
    WHERE id = p_challenge_id;
END;
$$;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';

COMMIT;
