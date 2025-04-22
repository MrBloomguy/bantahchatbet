-- Drop existing stories table if it exists
DROP TABLE IF EXISTS public.stories;

-- Create stories table with proper structure
CREATE TABLE public.stories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    admin_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Add index for admin_id
CREATE INDEX IF NOT EXISTS idx_stories_admin_id ON public.stories(admin_id);

-- Enable RLS
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

-- Create policies with simpler checks
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

-- Ensure storage bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('story-images', 'story-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies
DROP POLICY IF EXISTS "Stories - Public read access" ON storage.objects;
DROP POLICY IF EXISTS "Stories - Upload access" ON storage.objects;
DROP POLICY IF EXISTS "Stories - Update access" ON storage.objects;
DROP POLICY IF EXISTS "Stories - Delete access" ON storage.objects;

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
