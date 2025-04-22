-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view event participants" ON public.event_participants;
DROP POLICY IF EXISTS "Users can join events" ON public.event_participants;
DROP POLICY IF EXISTS "Users can manage their own participation" ON public.event_participants;

-- Enable RLS
ALTER TABLE public.event_participants ENABLE ROW LEVEL SECURITY;

-- Create policies for event_participants table
CREATE POLICY "Users can view event participants"
ON public.event_participants FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can join events"
ON public.event_participants FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM public.events
    WHERE id = event_id
    AND (
      NOT is_private OR -- Allow joining public events
      creator_id = auth.uid() -- Allow creator to add participants
    )
  )
);

CREATE POLICY "Users can manage their own participation"
ON public.event_participants FOR DELETE
TO authenticated
USING (
  auth.uid() = user_id OR -- Users can remove themselves
  EXISTS (
    SELECT 1 FROM public.events
    WHERE id = event_id
    AND creator_id = auth.uid() -- Event creators can remove participants
  )
);

-- Grant necessary permissions
GRANT SELECT, INSERT, DELETE ON public.event_participants TO authenticated;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';