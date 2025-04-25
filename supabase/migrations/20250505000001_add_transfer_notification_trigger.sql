-- Add transfer notification trigger
-- This trigger will create notifications when a user sends money to another user

-- First, check if we need to add a new notification type
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type' AND 
                  'wallet_transfer_received' = ANY(enum_range(NULL::notification_type)::text[])) THEN
        ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'wallet_transfer_received';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type' AND 
                  'wallet_transfer_sent' = ANY(enum_range(NULL::notification_type)::text[])) THEN
        ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'wallet_transfer_sent';
    END IF;
END
$$;

-- Create or replace the function to handle transfer notifications
CREATE OR REPLACE FUNCTION handle_wallet_transfer_notification()
RETURNS TRIGGER AS $$
DECLARE
    sender_name TEXT;
    recipient_name TEXT;
    sender_id UUID;
    recipient_id UUID;
BEGIN
    -- Only process transfers between users
    IF NEW.type = 'transfer' THEN
        -- Get sender and recipient information
        SELECT user_id INTO sender_id FROM wallets WHERE id = NEW.wallet_id;
        
        -- Get recipient wallet id and user id
        IF NEW.metadata ? 'recipient_wallet_id' THEN
            SELECT user_id INTO recipient_id 
            FROM wallets 
            WHERE id = (NEW.metadata->>'recipient_wallet_id')::UUID;
        ELSIF NEW.recipient_wallet_id IS NOT NULL THEN
            SELECT user_id INTO recipient_id 
            FROM wallets 
            WHERE id = NEW.recipient_wallet_id;
        END IF;
        
        -- Get user names
        SELECT username INTO sender_name FROM users WHERE id = sender_id;
        SELECT username INTO recipient_name FROM users WHERE id = recipient_id;
        
        -- Create notification for recipient
        IF recipient_id IS NOT NULL THEN
            INSERT INTO notifications (
                user_id,
                notification_type,
                title,
                content,
                metadata,
                created_at
            ) VALUES (
                recipient_id,
                'wallet_transfer_received',
                'Money Received',
                format('You received ₦%s from @%s', NEW.amount, sender_name),
                jsonb_build_object(
                    'transaction_id', NEW.id,
                    'sender_id', sender_id,
                    'amount', NEW.amount,
                    'balance_type', COALESCE(NEW.metadata->>'balance_type', 'real')
                ),
                NOW()
            );
        END IF;
        
        -- Create notification for sender
        INSERT INTO notifications (
            user_id,
            notification_type,
            title,
            content,
            metadata,
            created_at
        ) VALUES (
            sender_id,
            'wallet_transfer_sent',
            'Money Sent',
            format('You sent ₦%s to @%s', NEW.amount, recipient_name),
            jsonb_build_object(
                'transaction_id', NEW.id,
                'recipient_id', recipient_id,
                'amount', NEW.amount,
                'balance_type', COALESCE(NEW.metadata->>'balance_type', 'real')
            ),
            NOW()
        );
    END IF;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Error in handle_wallet_transfer_notification: %, SQLSTATE: %', SQLERRM, SQLSTATE;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger on transactions table
DROP TRIGGER IF EXISTS wallet_transfer_notification_trigger ON transactions;
CREATE TRIGGER wallet_transfer_notification_trigger
    AFTER INSERT ON transactions
    FOR EACH ROW
    WHEN (NEW.type = 'transfer' AND NEW.status = 'completed')
    EXECUTE FUNCTION handle_wallet_transfer_notification();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION handle_wallet_transfer_notification() TO authenticated;
