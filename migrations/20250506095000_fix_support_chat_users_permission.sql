-- Allow authenticated users to select from the users table
GRANT SELECT ON public.users TO authenticated;

-- The policy may already exist. If not, run this manually in the Supabase SQL editor:
-- CREATE POLICY "Allow authenticated read access"
--   ON public.users
--   FOR SELECT
--   USING (auth.role() = 'authenticated');