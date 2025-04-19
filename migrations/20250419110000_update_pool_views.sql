-- Update views to use standardized column names
CREATE OR REPLACE VIEW public.event_pools_summary AS
SELECT 
    event_id,
    entry_amount,
    total_amount,
    platform_fee,
    creator_fee,
    yes_pool,
    no_pool,
    updated_at
FROM public.event_pools;

-- Update the analytics view
CREATE OR REPLACE VIEW public.event_pools_analytics AS
SELECT 
    e.id as event_id,
    e.title as event_title,
    e.status as event_status,
    ep.total_amount,
    ep.platform_fee,
    ep.creator_fee,
    ep.yes_pool,
    ep.no_pool,
    ep.entry_amount,
    e.created_at,
    e.updated_at
FROM public.events e
JOIN public.event_pools ep ON e.id = ep.event_id;

-- Grant access to views
GRANT SELECT ON public.event_pools_summary TO authenticated;
GRANT SELECT ON public.event_pools_analytics TO authenticated;