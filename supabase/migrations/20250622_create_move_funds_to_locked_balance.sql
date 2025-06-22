-- Function: move_funds_to_locked_balance(user_ids uuid[], amount bigint)
-- Moves the specified amount from real_balance to locked_balance for each user in user_ids
-- Throws an error if any user has insufficient real_balance

CREATE OR REPLACE FUNCTION move_funds_to_locked_balance(user_ids uuid[], amount bigint)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  uid uuid;
BEGIN
  FOREACH uid IN ARRAY user_ids LOOP
    -- Check for sufficient balance
    IF (SELECT real_balance FROM wallets WHERE user_id = uid) < amount THEN
      RAISE EXCEPTION 'Insufficient real_balance for user %', uid;
    END IF;
    -- Move funds
    UPDATE wallets
    SET real_balance = real_balance - amount,
        locked_balance = locked_balance + amount
    WHERE user_id = uid;
  END LOOP;
END;
$$;
