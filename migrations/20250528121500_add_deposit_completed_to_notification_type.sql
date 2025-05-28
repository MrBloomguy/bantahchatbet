-- Add 'deposit_completed' to the notification_type enum if it does not exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
        CREATE TYPE notification_type AS ENUM ('deposit_completed');
    ELSIF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'deposit_completed' AND enumtypid = (
            SELECT oid FROM pg_type WHERE typname = 'notification_type'
        )
    ) THEN
        ALTER TYPE notification_type ADD VALUE 'deposit_completed';
    END IF;
END $$;
