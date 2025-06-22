-- Update the required_evidence check constraint to allow 'SCREENSHOT', 'VIDEO', and 'IMAGES'
ALTER TABLE challenges DROP CONSTRAINT IF EXISTS challenges_required_evidence_check;
ALTER TABLE challenges ADD CONSTRAINT challenges_required_evidence_check CHECK (required_evidence = ANY (ARRAY['SCREENSHOT', 'VIDEO', 'IMAGES']));

-- Optionally, add a comment for clarity
COMMENT ON COLUMN challenges.required_evidence IS 'Allowed values: SCREENSHOT, VIDEO, IMAGES.';
