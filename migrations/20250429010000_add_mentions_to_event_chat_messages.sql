-- Add mentions column to event_chat_messages table
ALTER TABLE public.event_chat_messages
ADD COLUMN IF NOT EXISTS mentions JSONB;

-- Add reply_to column to event_chat_messages table
ALTER TABLE public.event_chat_messages
ADD COLUMN IF NOT EXISTS reply_to UUID REFERENCES event_chat_messages(id) ON DELETE SET NULL;

-- Create an index for the mentions column to improve query performance
CREATE INDEX IF NOT EXISTS idx_event_chat_messages_mentions ON public.event_chat_messages USING gin (mentions);

-- Create an index for the reply_to column
CREATE INDEX IF NOT EXISTS idx_event_chat_messages_reply_to ON public.event_chat_messages(reply_to);

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';