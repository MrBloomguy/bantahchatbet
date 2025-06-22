-- Add a custom_game_name column to challenges table for custom games
ALTER TABLE challenges
ADD COLUMN IF NOT EXISTS custom_game_name TEXT;

-- (Optional) Add a comment for clarity
COMMENT ON COLUMN challenges.custom_game_name IS 'Custom game name if game_type is OTHER';
