-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view event pools" ON public.event_pools;
DROP POLICY IF EXISTS "Event creators can manage pools" ON public.event_pools;

-- Enable RLS
ALTER TABLE public.event_pools ENABLE ROW LEVEL SECURITY;

-- Create policies for event_pools table
CREATE POLICY "Users can view event pools"
ON public.event_pools FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Event creators can manage pools"
ON public.event_pools FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.events
    WHERE id = event_id
    AND creator_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.events
    WHERE id = event_id
    AND creator_id = auth.uid()
  )
);

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON public.event_pools TO authenticated;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';