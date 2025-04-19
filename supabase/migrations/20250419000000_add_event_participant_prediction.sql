-- Add prediction column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'event_participants' 
        AND column_name = 'prediction'
    ) THEN
        -- Add prediction column (true = YES, false = NO)
        ALTER TABLE public.event_participants 
        ADD COLUMN prediction BOOLEAN;

        -- Create index for better query performance
        CREATE INDEX idx_event_participants_prediction 
        ON public.event_participants(prediction);
    END IF;
END $$;

-- Create or replace view for event predictions summary
CREATE OR REPLACE VIEW public.event_predictions_summary AS
SELECT 
    event_id,
    COUNT(*) FILTER (WHERE prediction = true) as yes_count,
    COUNT(*) FILTER (WHERE prediction = false) as no_count,
    COUNT(*) as total_participants
FROM public.event_participants
GROUP BY event_id;

-- Grant access to the view
GRANT SELECT ON public.event_predictions_summary TO authenticated;

-- Create policy for the view
CREATE POLICY "Anyone can view event predictions summary"
    ON public.event_predictions_summary
    FOR SELECT
    USING (true);

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';