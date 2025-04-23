-- Fix event_pools table schema
DO $$
BEGIN
    -- Rename admin_fee to platform_fee if it exists
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'event_pools'
        AND column_name = 'admin_fee'
    ) THEN
        ALTER TABLE public.event_pools
        RENAME COLUMN admin_fee TO platform_fee;
    END IF;

    -- Add platform_fee column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'event_pools'
        AND column_name = 'platform_fee'
    ) THEN
        ALTER TABLE public.event_pools
        ADD COLUMN platform_fee NUMERIC DEFAULT 0;
    END IF;

    -- Add creator_fee column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'event_pools'
        AND column_name = 'creator_fee'
    ) THEN
        ALTER TABLE public.event_pools
        ADD COLUMN creator_fee NUMERIC DEFAULT 0;
    END IF;

    -- Add yes_pool column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'event_pools'
        AND column_name = 'yes_pool'
    ) THEN
        ALTER TABLE public.event_pools
        ADD COLUMN yes_pool NUMERIC DEFAULT 0;
    END IF;

    -- Add no_pool column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'event_pools'
        AND column_name = 'no_pool'
    ) THEN
        ALTER TABLE public.event_pools
        ADD COLUMN no_pool NUMERIC DEFAULT 0;
    END IF;

    -- Add entry_amount column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'event_pools'
        AND column_name = 'entry_amount'
    ) THEN
        ALTER TABLE public.event_pools
        ADD COLUMN entry_amount NUMERIC DEFAULT 0;
    END IF;

    -- Add yes_amount column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'event_pools'
        AND column_name = 'yes_amount'
    ) THEN
        ALTER TABLE public.event_pools
        ADD COLUMN yes_amount NUMERIC DEFAULT 0;
    END IF;

    -- Add no_amount column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'event_pools'
        AND column_name = 'no_amount'
    ) THEN
        ALTER TABLE public.event_pools
        ADD COLUMN no_amount NUMERIC DEFAULT 0;
    END IF;

    -- Add status column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'event_pools'
        AND column_name = 'status'
    ) THEN
        ALTER TABLE public.event_pools
        ADD COLUMN status TEXT DEFAULT 'pending';
    END IF;

    -- Add winning_pool column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'event_pools'
        AND column_name = 'winning_pool'
    ) THEN
        ALTER TABLE public.event_pools
        ADD COLUMN winning_pool NUMERIC DEFAULT 0;
    END IF;

    -- Add losing_pool column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'event_pools'
        AND column_name = 'losing_pool'
    ) THEN
        ALTER TABLE public.event_pools
        ADD COLUMN losing_pool NUMERIC DEFAULT 0;
    END IF;

    -- Update existing pools to have entry_amount from events table
    UPDATE public.event_pools ep
    SET entry_amount = e.wager_amount
    FROM public.events e
    WHERE ep.event_id = e.id
    AND ep.entry_amount = 0;
END $$;

-- Note: Views are updated in a separate migration file (20250422040000_fix_event_pools_view.sql)
-- to avoid issues with changing view column names

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
