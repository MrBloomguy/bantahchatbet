-- Add media_type column to event_chat_messages table
ALTER TABLE public.event_chat_messages
ADD COLUMN IF NOT EXISTS media_type VARCHAR(50);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_event_chat_messages_media_type 
    ON public.event_chat_messages(media_type);

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';