-- Add reply_to and mentions columns to event_chat_messages
ALTER TABLE public.event_chat_messages
  ADD COLUMN IF NOT EXISTS reply_to UUID REFERENCES public.event_chat_messages(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS mentions JSONB;

-- Optionally, add indexes for performance
CREATE INDEX IF NOT EXISTS idx_event_chat_messages_reply_to ON public.event_chat_messages(reply_to);
CREATE INDEX IF NOT EXISTS idx_event_chat_messages_mentions ON public.event_chat_messages USING GIN (mentions);
