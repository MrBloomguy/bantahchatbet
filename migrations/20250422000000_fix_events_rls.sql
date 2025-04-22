-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can create events" ON public.events;
DROP POLICY IF EXISTS "Events are viewable by everyone" ON public.events;

-- Enable RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Create policies for events table
CREATE POLICY "Events are viewable by everyone"
ON public.events FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can create events"
ON public.events FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = creator_id
);

CREATE POLICY "Users can update their own events"
ON public.events FOR UPDATE
TO authenticated
USING (
  auth.uid() = creator_id AND
  status = 'active'
)
WITH CHECK (
  auth.uid() = creator_id AND
  status = 'active'
);

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON public.events TO authenticated;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';