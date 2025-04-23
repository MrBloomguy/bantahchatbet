-- Fix all remaining references to admin_fee in triggers and functions

-- Drop existing triggers that might be using admin_fee
DROP TRIGGER IF EXISTS event_changes_trigger ON events;
DROP TRIGGER IF EXISTS on_event_changes ON events;
DROP TRIGGER IF EXISTS handle_participant_join_trigger ON event_participants;
DROP TRIGGER IF EXISTS on_participant_join ON event_participants;

-- Drop existing functions that might be using admin_fee
DROP FUNCTION IF EXISTS handle_event_changes() CASCADE;
DROP FUNCTION IF EXISTS handle_participant_join() CASCADE;
DROP FUNCTION IF EXISTS distribute_event_winnings(uuid) CASCADE;

-- Create updated handle_event_changes function
CREATE OR REPLACE FUNCTION handle_event_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- For new events
  IF (TG_OP = 'INSERT') THEN
    -- Initialize event pool
    INSERT INTO event_pools (
      event_id,
      total_amount,
      platform_fee,
      creator_fee,
      yes_pool,
      no_pool,
      entry_amount,
      yes_amount,
      no_amount,
      winning_pool,
      losing_pool,
      status
    ) VALUES (
      NEW.id,
      0,
      0,
      0,
      0,
      0,
      NEW.wager_amount,
      0,
      0,
      0,
      0,
      'pending'
    );
    RETURN NEW;

  -- For updated events
  ELSIF (TG_OP = 'UPDATE') THEN
    -- Handle status changes
    IF NEW.status != OLD.status THEN
      -- If event is completed, process payouts
      IF NEW.status = 'completed' THEN
        PERFORM process_event_payout(NEW.id);
      -- If event is cancelled, handle refunds
      ELSIF NEW.status = 'cancelled' THEN
        PERFORM cancel_event(NEW.id);
      END IF;
    END IF;

    RETURN NEW;

  -- For deleted events
  ELSIF (TG_OP = 'DELETE') THEN
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER event_changes_trigger
  AFTER INSERT OR UPDATE OR DELETE ON events
  FOR EACH ROW
  EXECUTE FUNCTION handle_event_changes();

-- Create updated handle_participant_join function
CREATE OR REPLACE FUNCTION handle_participant_join()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Update the pool amounts
    UPDATE event_pools
    SET
        total_amount = total_amount + NEW.wager_amount,
        winning_pool = CASE
            WHEN NEW.prediction THEN winning_pool + (NEW.wager_amount * 0.95)
            ELSE winning_pool
        END,
        losing_pool = CASE
            WHEN NOT NEW.prediction THEN losing_pool + (NEW.wager_amount * 0.95)
            ELSE losing_pool
        END,
        platform_fee = platform_fee + (NEW.wager_amount * 0.05)
    WHERE event_id = NEW.event_id;

    RETURN NEW;
END;
$$;

-- Create the participant join trigger
CREATE TRIGGER on_participant_join
  AFTER INSERT ON event_participants
  FOR EACH ROW
  EXECUTE FUNCTION handle_participant_join();

-- Create updated distribute_event_winnings function
CREATE OR REPLACE FUNCTION distribute_event_winnings(p_event_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total_pool integer;
    v_platform_fee integer;
    v_winning_prediction boolean;
    v_winner_count integer;
    v_payout_per_winner integer;
BEGIN
    -- Get event pool details
    SELECT total_amount, platform_fee
    INTO v_total_pool, v_platform_fee
    FROM event_pools
    WHERE event_id = p_event_id;

    -- Get winning prediction from completed event
    SELECT winning_prediction INTO v_winning_prediction
    FROM events
    WHERE id = p_event_id AND status = 'completed';

    -- Count winners
    SELECT COUNT(*) INTO v_winner_count
    FROM event_participants
    WHERE event_id = p_event_id
    AND prediction = v_winning_prediction;

    -- Calculate payout per winner (total pool minus platform fee, divided by winners)
    v_payout_per_winner := (v_total_pool - v_platform_fee) / v_winner_count;

    -- Distribute to winners
    INSERT INTO event_payouts (event_id, user_id, amount, status)
    SELECT
        p_event_id,
        user_id,
        v_payout_per_winner,
        'processed'
    FROM event_participants
    WHERE event_id = p_event_id
    AND prediction = v_winning_prediction;

    -- Update winner wallets
    UPDATE wallets w
    SET balance = balance + v_payout_per_winner
    FROM event_participants ep
    WHERE ep.event_id = p_event_id
    AND ep.prediction = v_winning_prediction
    AND ep.user_id = w.user_id;

    -- Collect platform fee
    PERFORM collect_admin_fee(p_event_id);
END;
$$;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
