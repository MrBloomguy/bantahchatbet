-- Rename admin_fee column to platform_fee in event_pools table
ALTER TABLE public.event_pools 
RENAME COLUMN admin_fee TO platform_fee;

-- Add a comment to describe the platform fee
COMMENT ON COLUMN public.event_pools.platform_fee IS 'Platform fee amount (2.5% of entry amount)';

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';