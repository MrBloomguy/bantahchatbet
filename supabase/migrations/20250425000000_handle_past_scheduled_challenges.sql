-- Create function to handle past scheduled challenges
CREATE OR REPLACE FUNCTION handle_past_scheduled_challenges()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update challenges with past scheduled dates to 'missed' status
  UPDATE challenges
  SET status = 'missed'
  WHERE status = 'accepted'
  AND scheduled_at < now()
  AND scheduled_at IS NOT NULL;

  -- Add system message for each updated challenge
  INSERT INTO challenge_messages (challenge_id, sender_id, content, type)
  SELECT
    id,
    NULL,
    'Challenge was marked as missed because the scheduled time has passed.',
    'system_message'
  FROM challenges
  WHERE status = 'missed'
  AND id NOT IN (
    SELECT challenge_id
    FROM challenge_messages
    WHERE content = 'Challenge was marked as missed because the scheduled time has passed.'
    AND type = 'system_message'
  );
END;
$$;

-- Create a trigger function to handle challenge status changes to 'missed'
CREATE OR REPLACE FUNCTION handle_challenge_missed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only proceed if status has changed to 'missed'
  IF NEW.status = 'missed' AND OLD.status != 'missed' THEN
    -- Process refunds for missed challenges
    -- Return funds to both challenger and challenged
    UPDATE wallets
    SET locked_balance = locked_balance - NEW.amount,
        real_balance = real_balance + NEW.amount
    WHERE user_id IN (NEW.challenger_id, NEW.challenged_id);

    -- Add notification for both users
    INSERT INTO notifications (user_id, type, title, content, metadata)
    VALUES
      (NEW.challenger_id, 'challenge_missed', 'Challenge Missed',
       'Your scheduled challenge was missed and has been refunded.',
       jsonb_build_object('challenge_id', NEW.id)),
      (NEW.challenged_id, 'challenge_missed', 'Challenge Missed',
       'Your scheduled challenge was missed and has been refunded.',
       jsonb_build_object('challenge_id', NEW.id));
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for challenge status changes to 'missed'
DROP TRIGGER IF EXISTS challenge_missed_trigger ON challenges;

CREATE TRIGGER challenge_missed_trigger
AFTER UPDATE OF status ON challenges
FOR EACH ROW
WHEN (NEW.status = 'missed')
EXECUTE FUNCTION handle_challenge_missed();

-- Instead of using cron, we'll create a trigger that runs on database access
-- This will check for past scheduled challenges whenever the challenges table is accessed

-- Create a function that will be called by the trigger
CREATE OR REPLACE FUNCTION check_past_scheduled_challenges()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Run the handle_past_scheduled_challenges function
  PERFORM handle_past_scheduled_challenges();
  RETURN NEW;
END;
$$;

-- Create a trigger that runs on INSERT or UPDATE to the challenges table
DROP TRIGGER IF EXISTS check_past_scheduled_challenges_trigger ON challenges;

CREATE TRIGGER check_past_scheduled_challenges_trigger
AFTER INSERT OR UPDATE ON challenges
FOR EACH STATEMENT
EXECUTE FUNCTION check_past_scheduled_challenges();

-- Note: For a production environment, it's recommended to set up a proper
-- scheduled job using pgAgent, a cron job on the server, or a serverless
-- function that runs periodically to call handle_past_scheduled_challenges().
