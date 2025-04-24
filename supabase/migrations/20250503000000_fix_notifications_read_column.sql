-- Fix notifications table read column issues
BEGIN;

-- First, check if the notifications table exists
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'notifications'
    ) THEN
        -- Check if 'read' column exists but 'read_at' doesn't
        IF EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'notifications' 
            AND column_name = 'read'
        ) AND NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'notifications' 
            AND column_name = 'read_at'
        ) THEN
            -- Add read_at column
            ALTER TABLE public.notifications 
            ADD COLUMN read_at TIMESTAMPTZ;
            
            -- Update read_at based on read column
            UPDATE public.notifications
            SET read_at = CASE WHEN read = true THEN NOW() ELSE NULL END;
        END IF;
        
        -- Check if 'read_at' exists but 'read' doesn't
        IF EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'notifications' 
            AND column_name = 'read_at'
        ) AND NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'notifications' 
            AND column_name = 'read'
        ) THEN
            -- Add read column
            ALTER TABLE public.notifications 
            ADD COLUMN read BOOLEAN DEFAULT false;
            
            -- Update read based on read_at column
            UPDATE public.notifications
            SET read = CASE WHEN read_at IS NOT NULL THEN true ELSE false END;
        END IF;
        
        -- Ensure both columns exist for backward compatibility
        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'notifications' 
            AND column_name = 'read'
        ) THEN
            ALTER TABLE public.notifications 
            ADD COLUMN read BOOLEAN DEFAULT false;
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'notifications' 
            AND column_name = 'read_at'
        ) THEN
            ALTER TABLE public.notifications 
            ADD COLUMN read_at TIMESTAMPTZ;
        END IF;
        
        -- Ensure notification_type column exists
        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'notifications' 
            AND column_name = 'notification_type'
        ) THEN
            -- Check if type column exists
            IF EXISTS (
                SELECT 1 
                FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'notifications' 
                AND column_name = 'type'
            ) THEN
                -- Rename type to notification_type
                ALTER TABLE public.notifications 
                RENAME COLUMN type TO notification_type;
            ELSE
                -- Add notification_type column
                ALTER TABLE public.notifications 
                ADD COLUMN notification_type TEXT NOT NULL DEFAULT 'system';
            END IF;
        END IF;
        
        -- Ensure content column exists
        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'notifications' 
            AND column_name = 'content'
        ) THEN
            -- Check if message column exists
            IF EXISTS (
                SELECT 1 
                FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'notifications' 
                AND column_name = 'message'
            ) THEN
                -- Rename message to content
                ALTER TABLE public.notifications 
                RENAME COLUMN message TO content;
            ELSE
                -- Add content column
                ALTER TABLE public.notifications 
                ADD COLUMN content TEXT NOT NULL DEFAULT 'Notification content';
            END IF;
        END IF;
    END IF;
END $$;

-- Create a trigger to keep read and read_at in sync
CREATE OR REPLACE FUNCTION sync_notification_read_columns()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        -- If read_at was updated but read wasn't
        IF NEW.read_at IS DISTINCT FROM OLD.read_at AND NEW.read IS NOT DISTINCT FROM OLD.read THEN
            NEW.read = CASE WHEN NEW.read_at IS NOT NULL THEN true ELSE false END;
        END IF;
        
        -- If read was updated but read_at wasn't
        IF NEW.read IS DISTINCT FROM OLD.read AND NEW.read_at IS NOT DISTINCT FROM OLD.read_at THEN
            NEW.read_at = CASE WHEN NEW.read = true THEN COALESCE(NEW.read_at, NOW()) ELSE NULL END;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS sync_notification_read_columns_trigger ON public.notifications;

-- Create the trigger
CREATE TRIGGER sync_notification_read_columns_trigger
BEFORE UPDATE ON public.notifications
FOR EACH ROW
EXECUTE FUNCTION sync_notification_read_columns();

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';

COMMIT;
