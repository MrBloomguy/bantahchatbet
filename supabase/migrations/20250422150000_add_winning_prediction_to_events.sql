-- Add winning_prediction column to events table for future use

-- Check if the column already exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'events' 
        AND column_name = 'winning_prediction'
    ) THEN
        -- Add the winning_prediction column
        ALTER TABLE public.events 
        ADD COLUMN winning_prediction BOOLEAN;
        
        -- Update existing events to set winning_prediction equal to result
        UPDATE public.events
        SET winning_prediction = result
        WHERE status = 'completed' AND result IS NOT NULL;
    END IF;
END $$;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
