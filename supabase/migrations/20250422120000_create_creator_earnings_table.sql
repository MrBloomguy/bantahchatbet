-- Create the creator_earnings table that's referenced in process_event_payouts

-- Create the creator_earnings table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.creator_earnings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'withdrawn')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_creator_earnings_creator_id ON creator_earnings(creator_id);
CREATE INDEX IF NOT EXISTS idx_creator_earnings_event_id ON creator_earnings(event_id);
CREATE INDEX IF NOT EXISTS idx_creator_earnings_status ON creator_earnings(status);

-- Enable RLS
ALTER TABLE creator_earnings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Creators can view their own earnings"
ON creator_earnings FOR SELECT
TO authenticated
USING (creator_id = auth.uid());

CREATE POLICY "System can insert creator earnings"
ON creator_earnings FOR INSERT
TO authenticated
WITH CHECK (true);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON creator_earnings TO authenticated;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
