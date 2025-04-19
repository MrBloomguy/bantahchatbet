-- Add indexes to optimize event_participants queries
CREATE INDEX IF NOT EXISTS idx_event_participants_event_id ON event_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_user_id ON event_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_prediction ON event_participants(prediction);

-- Drop indexes in case of rollback
DROP INDEX IF EXISTS idx_event_participants_event_id;
DROP INDEX IF EXISTS idx_event_participants_user_id;
DROP INDEX IF EXISTS idx_event_participants_prediction;