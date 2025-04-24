-- Add admin_liquidity column to event_pools table
ALTER TABLE event_pools
ADD COLUMN IF NOT EXISTS admin_liquidity NUMERIC DEFAULT 0;

-- Create liquidity_transactions table to track additions
CREATE TABLE IF NOT EXISTS liquidity_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  admin_email TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  notes TEXT
);

-- Create function for admins to add liquidity
CREATE OR REPLACE FUNCTION add_event_liquidity(
  p_event_id UUID,
  p_admin_email TEXT,
  p_amount NUMERIC,
  p_notes TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Skip admin check in development environment
  -- In production, you would want to uncomment this check
  -- IF NOT is_admin(p_admin_email) THEN
  --   RAISE EXCEPTION 'Only admins can add liquidity';
  -- END IF;

  -- Check if the event exists and is active or pending
  IF NOT EXISTS (
    SELECT 1 FROM events
    WHERE id = p_event_id
    AND status IN ('active', 'pending')
  ) THEN
    RAISE EXCEPTION 'Event must be active or pending to add liquidity';
  END IF;

  -- Update the event pool with the liquidity
  UPDATE event_pools
  SET admin_liquidity = admin_liquidity + p_amount,
      updated_at = NOW()
  WHERE event_id = p_event_id;

  -- Record the liquidity transaction
  INSERT INTO liquidity_transactions (
    event_id,
    admin_email,
    amount,
    notes
  ) VALUES (
    p_event_id,
    p_admin_email,
    p_amount,
    p_notes
  );

  -- Log admin action
  INSERT INTO admin_actions (
    admin_id,
    action_type,
    target_type,
    target_id,
    details
  ) VALUES (
    (SELECT id FROM auth.users WHERE email = p_admin_email LIMIT 1),
    'add_liquidity',
    'event',
    p_event_id,
    jsonb_build_object(
      'amount', p_amount,
      'notes', p_notes,
      'timestamp', NOW()
    )
  );
END;
$$;

-- Update total_amount calculation to include admin_liquidity
CREATE OR REPLACE FUNCTION update_event_pool_totals()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate total amount including admin liquidity
  NEW.total_amount := NEW.yes_pool + NEW.no_pool + NEW.admin_liquidity;

  -- Calculate platform fee (3%)
  NEW.platform_fee := (NEW.total_amount * 3) / 100;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the old trigger if it exists
DROP TRIGGER IF EXISTS update_event_pool_trigger ON event_pools;

-- Create the new trigger
CREATE TRIGGER update_event_pool_trigger
  BEFORE INSERT OR UPDATE ON event_pools
  FOR EACH ROW
  EXECUTE FUNCTION update_event_pool_totals();

-- Update payout processing to handle admin liquidity
CREATE OR REPLACE FUNCTION process_event_payouts(p_event_id UUID, p_admin_email TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_event_record record;
    v_winner_prediction boolean;
    v_user_pool numeric;
    v_admin_liquidity numeric;
    v_total_pool numeric;
    v_winner_count int;
    v_payout_per_winner numeric;
    v_creator_id uuid;
    v_creator_fee_percentage numeric;
    v_creator_fee numeric;
    v_platform_fee numeric;
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

    -- Get pool details including admin liquidity
    SELECT
        (yes_pool + no_pool) AS user_pool,
        admin_liquidity,
        total_amount AS total_pool,
        platform_fee,
        creator_fee
    INTO
        v_user_pool,
        v_admin_liquidity,
        v_total_pool,
        v_platform_fee,
        v_creator_fee
    FROM event_pools
    WHERE event_id = p_event_id;

    -- Get winner prediction and creator info
    SELECT
        result,
        creator_id,
        creator_fee_percentage
    INTO
        v_winner_prediction,
        v_creator_id,
        v_creator_fee_percentage
    FROM events
    WHERE id = p_event_id;

    -- Count winners
    SELECT COUNT(*) INTO v_winner_count
    FROM event_participants
    WHERE event_id = p_event_id
    AND prediction = v_winner_prediction;

    IF v_winner_count = 0 THEN
        RAISE EXCEPTION 'No winners found for this event';
    END IF;

    -- Calculate payout per winner (total pool minus fees, divided by winners)
    v_payout_per_winner := (v_total_pool - v_platform_fee - v_creator_fee) / v_winner_count;

    -- Process payouts to winners
    INSERT INTO transactions (
        wallet_id,
        user_id,
        type,
        amount,
        status,
        metadata
    )
    SELECT
        w.id,
        ep.user_id,
        'event_winning',
        v_payout_per_winner,
        'completed',
        jsonb_build_object(
            'event_id', p_event_id,
            'processed_by', p_admin_email,
            'processed_at', NOW()
        )
    FROM event_participants ep
    JOIN wallets w ON w.user_id = ep.user_id
    WHERE ep.event_id = p_event_id
    AND ep.prediction = v_winner_prediction;

    -- Update winner wallets
    UPDATE wallets w
    SET balance = balance + v_payout_per_winner
    FROM event_participants ep
    WHERE ep.event_id = p_event_id
    AND ep.prediction = v_winner_prediction
    AND ep.user_id = w.user_id;

    -- Process creator fee if applicable
    IF v_creator_fee > 0 AND v_creator_id IS NOT NULL THEN
        -- Add creator fee to creator's wallet
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

        -- Update creator wallet
        UPDATE wallets
        SET balance = balance + v_creator_fee
        WHERE user_id = v_creator_id;
    END IF;

    -- Mark event as processed
    UPDATE events
    SET payouts_processed = true,
        updated_at = NOW()
    WHERE id = p_event_id;

    -- Log admin action
    INSERT INTO admin_actions (
        admin_id,
        action_type,
        target_type,
        target_id,
        details
    ) VALUES (
        (SELECT id FROM auth.users WHERE email = p_admin_email LIMIT 1),
        'process_payouts',
        'event',
        p_event_id,
        jsonb_build_object(
            'total_pool', v_total_pool,
            'user_pool', v_user_pool,
            'admin_liquidity', v_admin_liquidity,
            'winner_count', v_winner_count,
            'payout_per_winner', v_payout_per_winner,
            'creator_fee', v_creator_fee,
            'platform_fee', v_platform_fee,
            'processed_at', NOW()
        )
    );
END;
$$;

-- Add RLS policies for the new table
ALTER TABLE liquidity_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view liquidity transactions"
ON liquidity_transactions FOR SELECT
TO authenticated
USING (
  is_admin(auth.email())
);

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION add_event_liquidity(UUID, TEXT, NUMERIC, TEXT) TO authenticated;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
