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

-- Add yes_amount and no_amount columns if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'event_pools' AND column_name = 'yes_amount'
    ) THEN
        ALTER TABLE event_pools ADD COLUMN yes_amount NUMERIC DEFAULT 0;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'event_pools' AND column_name = 'no_amount'
    ) THEN
        ALTER TABLE event_pools ADD COLUMN no_amount NUMERIC DEFAULT 0;
    END IF;
END $$;

-- Ensure all required columns exist in event_pools table
DO $$ 
BEGIN
    -- Add platform_fee column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'event_pools' 
        AND column_name = 'platform_fee'
    ) THEN
        ALTER TABLE public.event_pools 
        ADD COLUMN platform_fee NUMERIC DEFAULT 0;
    END IF;

    -- Add creator_fee column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'event_pools' 
        AND column_name = 'creator_fee'
    ) THEN
        ALTER TABLE public.event_pools 
        ADD COLUMN creator_fee NUMERIC DEFAULT 0;
    END IF;

    -- Add yes_pool column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'event_pools' 
        AND column_name = 'yes_pool'
    ) THEN
        ALTER TABLE public.event_pools 
        ADD COLUMN yes_pool NUMERIC DEFAULT 0;
    END IF;

    -- Add no_pool column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'event_pools' 
        AND column_name = 'no_pool'
    ) THEN
        ALTER TABLE public.event_pools 
        ADD COLUMN no_pool NUMERIC DEFAULT 0;
    END IF;

    -- Add total_amount column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'event_pools' 
        AND column_name = 'total_amount'
    ) THEN
        ALTER TABLE public.event_pools 
        ADD COLUMN total_amount NUMERIC DEFAULT 0;
    END IF;
END $$;

-- Add constraints
ALTER TABLE public.event_pools
    ALTER COLUMN total_amount SET DEFAULT 0,
    ALTER COLUMN platform_fee SET DEFAULT 0,
    ALTER COLUMN creator_fee SET DEFAULT 0,
    ALTER COLUMN yes_pool SET DEFAULT 0,
    ALTER COLUMN no_pool SET DEFAULT 0;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_event_pools_entry_amount 
ON public.event_pools(entry_amount);

-- Create an updated view
CREATE OR REPLACE VIEW public.event_pools_summary AS
SELECT 
    event_id,
    entry_amount,
    total_amount,
    platform_fee,
    creator_fee,
    yes_pool,
    no_pool,
    yes_amount,
    no_amount,
    updated_at
FROM public.event_pools;

-- Grant access to the view
GRANT SELECT ON public.event_pools_summary TO authenticated;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';