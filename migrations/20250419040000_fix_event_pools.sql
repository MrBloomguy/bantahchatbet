-- Add entry_amount column to event_pools table
DO $$ 
BEGIN
    -- Add entry_amount column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'event_pools' 
        AND column_name = 'entry_amount'
    ) THEN
        ALTER TABLE public.event_pools 
        ADD COLUMN entry_amount NUMERIC NOT NULL DEFAULT 0;
    END IF;

    -- Migrate existing wager_amount from events table to entry_amount in event_pools
    UPDATE public.event_pools ep
    SET entry_amount = e.wager_amount
    FROM public.events e
    WHERE ep.event_id = e.id
    AND ep.entry_amount = 0;

    -- Add not null constraint after migration
    ALTER TABLE public.event_pools 
    ALTER COLUMN entry_amount SET NOT NULL;
END $$;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_event_pools_entry_amount 
ON public.event_pools(entry_amount);

-- Update view to include entry_amount
CREATE OR REPLACE VIEW public.event_pools_summary AS
SELECT 
    event_id,
    entry_amount,
    total_amount,
    yes_amount,
    no_amount,
    updated_at
FROM public.event_pools;