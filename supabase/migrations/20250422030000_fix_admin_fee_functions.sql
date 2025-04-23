-- Update the collect_admin_fee function to use platform_fee
CREATE OR REPLACE FUNCTION collect_admin_fee(p_event_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_platform_fee integer;
BEGIN
    -- Get platform fee from event pool
    SELECT platform_fee INTO v_platform_fee
    FROM event_pools
    WHERE event_id = p_event_id;

    -- Add fee to platform wallet
    UPDATE platform_wallet
    SET balance = balance + v_platform_fee,
        updated_at = now();

    -- Record fee collection
    INSERT INTO fee_collections (event_id, amount, status)
    VALUES (p_event_id, v_platform_fee, 'processed');
END;
$$;

-- Update the update_event_pool function
CREATE OR REPLACE FUNCTION update_event_pool()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate platform fee (3%)
  NEW.platform_fee := (NEW.total_amount * 3) / 100;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the old trigger if it exists
DROP TRIGGER IF EXISTS update_event_pool_trigger ON event_pools;

-- Create the new trigger
CREATE TRIGGER update_event_pool_trigger
  BEFORE INSERT OR UPDATE ON event_pools
  FOR EACH ROW
  EXECUTE FUNCTION update_event_pool();

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
