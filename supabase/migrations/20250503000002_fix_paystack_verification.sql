-- Fix Paystack verification function to update both balance and real_balance
BEGIN;

-- Function to verify and process Paystack transactions
CREATE OR REPLACE FUNCTION verify_paystack_transaction(
  p_reference TEXT,
  p_amount INTEGER,
  p_status TEXT,
  p_transaction_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_wallet_id UUID;
  v_user_id UUID;
  v_transaction_id UUID;
BEGIN
  -- Get wallet ID for current user
  SELECT w.id, w.user_id INTO v_wallet_id, v_user_id
  FROM wallets w
  WHERE w.user_id = auth.uid();

  IF v_wallet_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Wallet not found');
  END IF;

  -- Check if transaction already exists
  IF EXISTS (
    SELECT 1 FROM transactions 
    WHERE reference = p_reference 
    AND status = 'completed'
  ) THEN
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Transaction already processed',
      'wallet_id', v_wallet_id,
      'amount', p_amount
    );
  END IF;

  -- Record transaction
  INSERT INTO transactions (
    wallet_id,
    user_id,
    amount,
    type,
    status,
    reference,
    payment_provider,
    provider_reference
  ) VALUES (
    v_wallet_id,
    v_user_id,
    p_amount,
    'deposit',
    p_status,
    p_reference,
    'paystack',
    p_transaction_id
  ) RETURNING id INTO v_transaction_id;

  -- If payment successful, update wallet balance
  IF p_status = 'completed' THEN
    -- Update both balance and real_balance columns
    UPDATE wallets 
    SET 
      balance = COALESCE(balance, 0) + p_amount,
      real_balance = COALESCE(real_balance, 0) + p_amount,
      updated_at = NOW()
    WHERE id = v_wallet_id;

    -- Create notification
    INSERT INTO notifications (
      user_id,
      notification_type,
      title,
      content,
      metadata,
      read,
      read_at
    )
    VALUES (
      v_user_id,
      'deposit_completed',
      'Deposit Successful',
      'Your wallet has been credited with ₦' || p_amount::text,
      jsonb_build_object(
        'amount', p_amount,
        'transaction_id', v_transaction_id,
        'reference', p_reference
      ),
      false,
      NULL
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'wallet_id', v_wallet_id,
    'amount', p_amount,
    'transaction_id', v_transaction_id
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION verify_paystack_transaction(TEXT, INTEGER, TEXT, TEXT) TO authenticated;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';

COMMIT;
