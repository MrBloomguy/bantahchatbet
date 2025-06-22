-- Sync locked_balance for all users in accepted challenges
-- This will ensure locked_balance is at least the challenge amount for all users in accepted challenges

UPDATE wallets w
SET locked_balance = locked_balance + c.amount
FROM challenges c
WHERE (w.user_id = c.challenger_id OR w.user_id = c.challenged_id)
  AND c.status = 'accepted'
  AND w.locked_balance < c.amount;
