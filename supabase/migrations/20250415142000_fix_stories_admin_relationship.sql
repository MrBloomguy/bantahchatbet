-- First, check if the stories table exists
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'stories') THEN
    -- Drop existing foreign key constraint if it exists
    BEGIN
      ALTER TABLE public.stories DROP CONSTRAINT IF EXISTS stories_admin_id_fkey;
    EXCEPTION WHEN OTHERS THEN
      -- Constraint doesn't exist or can't be dropped, continue
    END;
    
    -- Update the admin_id column to reference profiles instead of auth.users
    ALTER TABLE public.stories 
    ALTER COLUMN admin_id TYPE UUID,
    ADD CONSTRAINT stories_admin_id_fkey 
    FOREIGN KEY (admin_id) 
    REFERENCES public.profiles(id) ON DELETE CASCADE;
    
    -- Add an index for better performance
    CREATE INDEX IF NOT EXISTS idx_stories_admin_id ON public.stories(admin_id);
  ELSE
    -- Create the stories table with proper references
    CREATE TABLE public.stories (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      image_url TEXT,
      admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );
    
    -- Add an index for better performance
    CREATE INDEX idx_stories_admin_id ON public.stories(admin_id);
  END IF;
END $$;

-- Update the Stories page query
COMMENT ON TABLE public.stories IS 'Stories created by admins';
COMMENT ON COLUMN public.stories.admin_id IS 'References the profile ID of the admin who created the story';

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
