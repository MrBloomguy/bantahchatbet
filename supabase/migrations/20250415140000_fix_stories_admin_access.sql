-- Drop existing policies
DROP POLICY IF EXISTS "Stories - Public read access" ON stories;
DROP POLICY IF EXISTS "Stories - Admin insert access" ON stories;
DROP POLICY IF EXISTS "Stories - Admin update access" ON stories;
DROP POLICY IF EXISTS "Stories - Admin delete access" ON stories;

-- Create new policies with simpler admin checks
CREATE POLICY "Stories - Public read access"
    ON stories FOR SELECT
    TO authenticated
    USING (true);

-- Allow any authenticated user to insert stories (the application will handle admin checks)
CREATE POLICY "Stories - Insert access"
    ON stories FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Allow users to update their own stories
CREATE POLICY "Stories - Update access"
    ON stories FOR UPDATE
    TO authenticated
    USING (auth.uid() = admin_id);

-- Allow users to delete their own stories
CREATE POLICY "Stories - Delete access"
    ON stories FOR DELETE
    TO authenticated
    USING (auth.uid() = admin_id);

-- Drop existing storage policies
DROP POLICY IF EXISTS "Stories - Public read access" ON storage.objects;
DROP POLICY IF EXISTS "Stories - Admin upload access" ON storage.objects;
DROP POLICY IF EXISTS "Stories - Admin update access" ON storage.objects;
DROP POLICY IF EXISTS "Stories - Admin delete access" ON storage.objects;

-- Create new storage policies with simpler checks
CREATE POLICY "Stories - Public read access"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'story-images');

-- Allow any authenticated user to upload to story-images bucket
CREATE POLICY "Stories - Upload access"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'story-images');

-- Allow any authenticated user to update objects in story-images bucket
CREATE POLICY "Stories - Update access"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'story-images');

-- Allow any authenticated user to delete objects in story-images bucket
CREATE POLICY "Stories - Delete access"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'story-images');

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
