-- Create chat-images bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-images', 'chat-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload images
CREATE POLICY "Allow authenticated users to upload chat images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'chat-images');

-- Allow authenticated users to update their own images
CREATE POLICY "Allow users to update their own chat images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'chat-images' AND owner = auth.uid());

-- Allow public access to read chat images
CREATE POLICY "Allow public to read chat images"
ON storage.objects FOR SELECT
USING (bucket_id = 'chat-images');

-- Allow users to delete their own images
CREATE POLICY "Allow users to delete their own chat images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'chat-images' AND owner = auth.uid());

-- Grant necessary permissions
GRANT ALL ON storage.objects TO authenticated;
GRANT SELECT ON storage.objects TO anon;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';