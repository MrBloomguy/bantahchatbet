-- Add result column to events table
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS result BOOLEAN;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_events_result ON public.events(result);

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';