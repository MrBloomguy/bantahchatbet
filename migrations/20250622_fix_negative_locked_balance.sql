-- Fix negative locked_balance values in wallets
UPDATE wallets
SET locked_balance = 0
WHERE locked_balance < 0;

-- Optionally, log affected rows (for manual review)
-- SELECT * FROM wallets WHERE locked_balance < 0;
