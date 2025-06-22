-- Drop the game_type check constraint to allow any value for game_type
ALTER TABLE challenges DROP CONSTRAINT IF EXISTS challenges_game_type_check;

-- Optionally, add a comment for clarity
COMMENT ON COLUMN challenges.game_type IS 'Game type, now allows any value as per UI pills or custom input.';
