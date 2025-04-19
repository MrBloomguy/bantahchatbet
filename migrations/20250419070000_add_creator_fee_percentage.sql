-- Add creator_fee_percentage column to events table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'events'
        AND column_name = 'creator_fee_percentage'
    ) THEN
        ALTER TABLE events
        ADD COLUMN creator_fee_percentage DECIMAL(5,2) DEFAULT 5.00;
    END IF;
END $$;