-- Drop existing view if it exists
DROP VIEW IF EXISTS public.event_predictions_summary;

-- Create the predictions summary view
CREATE OR REPLACE VIEW public.event_predictions_summary AS
SELECT 
    event_id,
    COUNT(*) FILTER (WHERE prediction = true) as yes_count,
    COUNT(*) FILTER (WHERE prediction = false) as no_count,
    COUNT(*) as total_participants,
    MAX(created_at) as last_prediction_at
FROM public.event_participants
GROUP BY event_id;

-- Grant access to authenticated users
GRANT SELECT ON public.event_predictions_summary TO authenticated;