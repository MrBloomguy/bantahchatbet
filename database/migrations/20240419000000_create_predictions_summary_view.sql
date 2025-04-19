-- Create event_predictions_summary view
CREATE OR REPLACE VIEW event_predictions_summary AS
SELECT 
  event_id,
  COUNT(*) FILTER (WHERE prediction = true) as yes_count,
  COUNT(*) FILTER (WHERE prediction = false) as no_count,
  COUNT(*) as total_participants
FROM event_participants
GROUP BY event_id;

-- Drop view in case of rollback
DROP VIEW IF EXISTS event_predictions_summary;