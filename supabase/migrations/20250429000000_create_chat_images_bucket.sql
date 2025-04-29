-- Create chat-images bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-images', 'chat-images', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Chat Images - Public read access" ON storage.objects;
DROP POLICY IF EXISTS "Chat Images - Upload access" ON storage.objects;
DROP POLICY IF EXISTS "Chat Images - Update access" ON storage.objects;
DROP POLICY IF EXISTS "Chat Images - Delete access" ON storage.objects;

-- Create new storage policies
CREATE POLICY "Chat Images - Public read access"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'chat-images');

-- Allow any authenticated user to upload to chat-images bucket
CREATE POLICY "Chat Images - Upload access"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'chat-images');

-- Allow any authenticated user to update their own chat images
CREATE POLICY "Chat Images - Update access"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'chat-images' AND auth.uid()::text = owner_id);

-- Allow any authenticated user to delete their own chat images
CREATE POLICY "Chat Images - Delete access"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'chat-images' AND auth.uid()::text = owner_id);

-- Grant necessary permissions
GRANT ALL ON storage.objects TO authenticated;
GRANT SELECT ON storage.objects TO anon;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';