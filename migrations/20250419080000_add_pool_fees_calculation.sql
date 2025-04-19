-- Function to calculate pool fees based on amount and creator fee percentage
CREATE OR REPLACE FUNCTION public.calculate_pool_fees(
    amount NUMERIC,
    creator_fee_pct NUMERIC
) RETURNS TABLE (
    creator_fee NUMERIC,
    platform_fee NUMERIC,
    net_amount NUMERIC
) AS $$
DECLARE
    platform_fee_pct CONSTANT NUMERIC := 2.5; -- 2.5% platform fee
BEGIN
    RETURN QUERY
    SELECT 
        ROUND((amount * creator_fee_pct / 100)::NUMERIC, 2) as creator_fee,
        ROUND((amount * platform_fee_pct / 100)::NUMERIC, 2) as platform_fee,
        ROUND((amount - (amount * (creator_fee_pct + platform_fee_pct) / 100))::NUMERIC, 2) as net_amount;
END;
$$ LANGUAGE plpgsql;

-- Add permissions for the calculate_pool_fees function
GRANT EXECUTE ON FUNCTION public.calculate_pool_fees(NUMERIC, NUMERIC) TO authenticated, service_role;