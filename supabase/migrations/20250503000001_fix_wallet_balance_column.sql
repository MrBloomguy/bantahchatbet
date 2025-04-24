-- Fix wallet table balance column issues
BEGIN;

-- First, check if the wallets table exists
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'wallets'
    ) THEN
        -- Check if 'balance' column exists but 'real_balance' doesn't
        IF EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'wallets' 
            AND column_name = 'balance'
        ) AND NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'wallets' 
            AND column_name = 'real_balance'
        ) THEN
            -- Add real_balance column
            ALTER TABLE public.wallets 
            ADD COLUMN real_balance DECIMAL(10,2) DEFAULT 0;
            
            -- Update real_balance based on balance column
            UPDATE public.wallets
            SET real_balance = balance;
        END IF;
        
        -- Check if 'real_balance' exists but 'balance' doesn't
        IF EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'wallets' 
            AND column_name = 'real_balance'
        ) AND NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'wallets' 
            AND column_name = 'balance'
        ) THEN
            -- Add balance column
            ALTER TABLE public.wallets 
            ADD COLUMN balance DECIMAL(10,2) DEFAULT 0;
            
            -- Update balance based on real_balance column
            UPDATE public.wallets
            SET balance = real_balance;
        END IF;
        
        -- Ensure both columns exist for backward compatibility
        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'wallets' 
            AND column_name = 'balance'
        ) THEN
            ALTER TABLE public.wallets 
            ADD COLUMN balance DECIMAL(10,2) DEFAULT 0;
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'wallets' 
            AND column_name = 'real_balance'
        ) THEN
            ALTER TABLE public.wallets 
            ADD COLUMN real_balance DECIMAL(10,2) DEFAULT 0;
        END IF;
    END IF;
END $$;

-- Create a trigger to keep balance and real_balance in sync
CREATE OR REPLACE FUNCTION sync_wallet_balance_columns()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        -- If real_balance was updated but balance wasn't
        IF NEW.real_balance IS DISTINCT FROM OLD.real_balance AND NEW.balance IS NOT DISTINCT FROM OLD.balance THEN
            NEW.balance = NEW.real_balance;
        END IF;
        
        -- If balance was updated but real_balance wasn't
        IF NEW.balance IS DISTINCT FROM OLD.balance AND NEW.real_balance IS NOT DISTINCT FROM OLD.real_balance THEN
            NEW.real_balance = NEW.balance;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS sync_wallet_balance_columns_trigger ON public.wallets;

-- Create the trigger
CREATE TRIGGER sync_wallet_balance_columns_trigger
BEFORE UPDATE ON public.wallets
FOR EACH ROW
EXECUTE FUNCTION sync_wallet_balance_columns();

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';

COMMIT;
