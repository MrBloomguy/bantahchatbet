-- Expose the award_points function as an RPC function for admin use

-- First, create the point_transactions table if it doesn't exist
CREATE TABLE IF NOT EXISTS point_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    points INTEGER NOT NULL,
    action_type TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_point_transactions_user_id ON point_transactions(user_id);

-- Enable RLS
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Users can view their own point transactions" ON point_transactions;
CREATE POLICY "Users can view their own point transactions"
    ON point_transactions FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Create or replace the award_points function
CREATE OR REPLACE FUNCTION award_points(
  p_user_id UUID,
  p_points INTEGER,
  p_action_type TEXT,
  p_description TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS void AS $$
BEGIN
  -- Insert point transaction
  INSERT INTO point_transactions (
      user_id,
      points,
      action_type,
      description,
      metadata
  ) VALUES (
      p_user_id,
      p_points,
      p_action_type,
      p_description,
      p_metadata
  );

  -- Update user's reputation score
  UPDATE users
  SET reputation_score = COALESCE(reputation_score, 0) + p_points
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create admin-only RPC policy for award_points
DROP POLICY IF EXISTS "Admin can award points" ON point_transactions;
CREATE POLICY "Admin can award points"
  ON point_transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND is_admin = true
    )
  );

-- Grant execute permission to authenticated users (RLS will restrict to admins)
GRANT EXECUTE ON FUNCTION award_points(UUID, INTEGER, TEXT, TEXT, JSONB) TO authenticated;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
