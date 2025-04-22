-- Create story-images bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('story-images', 'story-images', true)
ON CONFLICT (id) DO NOTHING;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
