-- Award points for financial transactions

-- Deposit points trigger
CREATE OR REPLACE FUNCTION award_deposit_points() RETURNS TRIGGER AS $$
DECLARE
    deposit_count INTEGER;
BEGIN
    -- Count successful deposits for this user
    SELECT COUNT(*) INTO deposit_count
    FROM transactions
    WHERE user_id = NEW.user_id
    AND type = 'deposit'
    AND status = 'completed';
    
    -- Award points for successful deposits
    IF NEW.type = 'deposit' AND NEW.status = 'completed' THEN
        -- First deposit bonus
        IF deposit_count = 1 THEN
            PERFORM award_points(
                NEW.user_id,
                200,
                'first_deposit',
                'Welcome bonus for first deposit',
                jsonb_build_object('transaction_id', NEW.id, 'amount', NEW.amount)
            );
        ELSE
            -- Regular deposit points (1 point per 1000 in deposit)
            PERFORM award_points(
                NEW.user_id,
                GREATEST(FLOOR(NEW.amount::numeric / 1000), 1)::integer,
                'deposit_points',
                'Points awarded for deposit',
                jsonb_build_object('transaction_id', NEW.id, 'amount', NEW.amount)
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER award_deposit_points_trigger
    AFTER INSERT OR UPDATE OF status ON transactions
    FOR EACH ROW
    WHEN (NEW.type = 'deposit' AND NEW.status = 'completed')
    EXECUTE FUNCTION award_deposit_points();

-- Withdrawal verification function
CREATE OR REPLACE FUNCTION verify_withdrawal_eligibility(user_id UUID) RETURNS boolean AS $$
DECLARE
    user_points INTEGER;
BEGIN
    -- Get user's current points
    SELECT reputation_score INTO user_points
    FROM users
    WHERE id = user_id;
    
    -- User needs at least 100 points to withdraw
    RETURN COALESCE(user_points, 0) >= 100;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to process withdrawal requests
CREATE OR REPLACE FUNCTION process_withdrawal_request() RETURNS TRIGGER AS $$
BEGIN
    -- Check if user is eligible for withdrawal
    IF NOT verify_withdrawal_eligibility(NEW.user_id) THEN
        RAISE EXCEPTION 'User needs at least 100 points to withdraw funds';
    END IF;
    
    -- If this is a successful withdrawal, deduct some points
    IF NEW.type = 'withdrawal' AND NEW.status = 'completed' THEN
        -- Deduct 10 points for each withdrawal
        PERFORM award_points(
            NEW.user_id,
            -10,
            'withdrawal_fee',
            'Points deducted for withdrawal',
            jsonb_build_object('transaction_id', NEW.id, 'amount', NEW.amount)
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER process_withdrawal_request_trigger
    BEFORE INSERT OR UPDATE OF status ON transactions
    FOR EACH ROW
    WHEN (NEW.type = 'withdrawal')
    EXECUTE FUNCTION process_withdrawal_request();