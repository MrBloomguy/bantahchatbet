-- Add 'missed' to the allowed status values for challenges
ALTER TABLE challenges
DROP CONSTRAINT IF EXISTS challenges_status_check;

ALTER TABLE challenges
ADD CONSTRAINT challenges_status_check
CHECK (status IN ('pending', 'accepted', 'declined', 'completed', 'expired', 'missed'));

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
