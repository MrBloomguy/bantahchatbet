-- Create a function to sync wallet balance to user_stats
CREATE OR REPLACE FUNCTION sync_wallet_to_user_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update user_stats with wallet balance if it exists
  UPDATE user_stats
  SET 
    total_earnings = CASE 
      WHEN total_earnings = 0 OR total_earnings IS NULL THEN 
        NEW.real_balance + NEW.bonus_balance
      ELSE 
        total_earnings
      END,
    current_balance = NEW.real_balance + NEW.bonus_balance,
    updated_at = NOW()
  WHERE user_id = NEW.user_id;
  
  -- If user_stats doesn't exist for this user, create it
  IF NOT FOUND THEN
    INSERT INTO user_stats (
      user_id,
      events_created,
      events_participated,
      total_wagered_yes,
      total_wagered_no,
      events_won,
      events_lost,
      current_balance,
      total_earnings,
      updated_at
    ) VALUES (
      NEW.user_id,
      0, -- events_created
      0, -- events_participated
      0, -- total_wagered_yes
      0, -- total_wagered_no
      0, -- events_won
      0, -- events_lost
      NEW.real_balance + NEW.bonus_balance, -- current_balance
      NEW.real_balance + NEW.bonus_balance, -- total_earnings
      NOW() -- updated_at
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to sync wallet data to user_stats
DROP TRIGGER IF EXISTS sync_wallet_to_user_stats_trigger ON wallets;

CREATE TRIGGER sync_wallet_to_user_stats_trigger
AFTER INSERT OR UPDATE OF real_balance, bonus_balance ON wallets
FOR EACH ROW
EXECUTE FUNCTION sync_wallet_to_user_stats();

-- Run a one-time sync for all existing wallets
DO $$
BEGIN
  -- Update user_stats for all existing wallets
  UPDATE user_stats us
  SET 
    total_earnings = CASE 
      WHEN us.total_earnings = 0 OR us.total_earnings IS NULL THEN 
        w.real_balance + w.bonus_balance
      ELSE 
        us.total_earnings
      END,
    current_balance = w.real_balance + w.bonus_balance,
    updated_at = NOW()
  FROM wallets w
  WHERE us.user_id = w.user_id;
  
  -- Insert user_stats for users with wallets but no stats
  INSERT INTO user_stats (
    user_id,
    events_created,
    events_participated,
    total_wagered_yes,
    total_wagered_no,
    events_won,
    events_lost,
    current_balance,
    total_earnings,
    updated_at
  )
  SELECT 
    w.user_id,
    0, -- events_created
    0, -- events_participated
    0, -- total_wagered_yes
    0, -- total_wagered_no
    0, -- events_won
    0, -- events_lost
    w.real_balance + w.bonus_balance, -- current_balance
    w.real_balance + w.bonus_balance, -- total_earnings
    NOW() -- updated_at
  FROM wallets w
  LEFT JOIN user_stats us ON w.user_id = us.user_id
  WHERE us.user_id IS NULL;
END;
$$;
