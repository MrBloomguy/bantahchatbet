-- Drop the platform check constraint to allow any value for platform
ALTER TABLE challenges DROP CONSTRAINT IF EXISTS challenges_platform_check;

-- Optionally, add a comment for clarity
COMMENT ON COLUMN challenges.platform IS 'Platform, now allows any value as per UI pills or custom input.';
