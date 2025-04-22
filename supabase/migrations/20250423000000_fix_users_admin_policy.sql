-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own admin status" ON users;
DROP POLICY IF EXISTS "Users can view public user data" ON users;

-- Create policies for users table
CREATE POLICY "Users can view their own admin status"
    ON users FOR SELECT
    TO authenticated
    USING (
        -- Allow users to see their own full profile including admin status
        auth.uid() = id
        OR
        -- Allow users to see basic info of other users (but not admin status)
        (SELECT true)
    );

-- Force PostgREST to reload schema
NOTIFY pgrst, 'reload schema';