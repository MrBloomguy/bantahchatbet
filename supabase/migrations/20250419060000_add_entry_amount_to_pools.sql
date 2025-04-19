-- Add entry_amount column to event_pools table
ALTER TABLE public.event_pools 
ADD COLUMN IF NOT EXISTS entry_amount DECIMAL(10,2);

-- Copy wager_amount from events table to entry_amount in event_pools
UPDATE public.event_pools ep
SET entry_amount = e.wager_amount
FROM public.events e
WHERE ep.event_id = e.id;

-- Make entry_amount NOT NULL after populating data
ALTER TABLE public.event_pools 
ALTER COLUMN entry_amount SET NOT NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_event_pools_entry_amount 
ON public.event_pools(entry_amount);

-- Add constraint to ensure entry_amount is positive
ALTER TABLE public.event_pools
ADD CONSTRAINT event_pools_entry_amount_check
CHECK (entry_amount > 0);

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';