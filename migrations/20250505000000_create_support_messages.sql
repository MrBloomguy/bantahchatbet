-- First drop any existing triggers to avoid conflicts
DROP TRIGGER IF EXISTS on_new_support_message ON public.support_messages;
DROP FUNCTION IF EXISTS public.handle_new_support_message();

-- Drop and recreate the table to ensure clean schema
DROP TABLE IF EXISTS public.support_messages;

-- Create support_messages table
CREATE TABLE public.support_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_support BOOLEAN DEFAULT FALSE,
    read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_support_messages_user_id ON public.support_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_created_at ON public.support_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_support_messages_read ON public.support_messages(read);

-- Enable RLS
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own messages" ON public.support_messages;
DROP POLICY IF EXISTS "Users can insert their own messages" ON public.support_messages;
DROP POLICY IF EXISTS "Support can update messages" ON public.support_messages;

-- Create policies
CREATE POLICY "Users can view their own messages"
    ON public.support_messages
    FOR SELECT
    USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_user_meta_data->>'role' = 'support'
        )
    );

CREATE POLICY "Users can insert their own messages"
    ON public.support_messages
    FOR INSERT
    WITH CHECK (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_user_meta_data->>'role' = 'support'
        )
    );

CREATE POLICY "Support can update messages"
    ON public.support_messages
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_user_meta_data->>'role' = 'support'
        )
    );

-- Grant permissions
GRANT ALL ON public.support_messages TO authenticated;

-- Create notification function
CREATE OR REPLACE FUNCTION public.handle_new_support_message()
RETURNS TRIGGER AS $$
BEGIN
    -- If message is not from support, send notification to admins
    IF NOT NEW.is_support THEN
        INSERT INTO public.notifications (
            user_id,
            title,
            content,
            notification_type,
            metadata
        )
        SELECT 
            u.id,
            'New Support Message',
            'A user needs assistance',
            'support_message',
            jsonb_build_object(
                'user_id', NEW.user_id,
                'message_id', NEW.id
            )
        FROM auth.users u
        WHERE u.raw_user_meta_data->>'role' = 'support';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new messages
CREATE TRIGGER on_new_support_message
    AFTER INSERT ON public.support_messages
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_support_message();

-- Force schema cache refresh
NOTIFY pgrst, 'reload schema';