-- Create event chat message reactions table
CREATE TABLE IF NOT EXISTS event_chat_message_reactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id uuid REFERENCES event_chat_messages(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    emoji text NOT NULL,
    created_at timestamptz DEFAULT now(),
    UNIQUE(message_id, user_id, emoji)
);

-- Enable RLS
ALTER TABLE event_chat_message_reactions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view all reactions"
    ON event_chat_message_reactions FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can add reactions"
    ON event_chat_message_reactions FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own reactions"
    ON event_chat_message_reactions FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);
