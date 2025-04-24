-- Add column to store additional participant count for display purposes
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS display_participant_boost INTEGER DEFAULT 0;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_events_display_participant_boost ON events(display_participant_boost);

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
