-- Enable the pgcrypto extension if it doesn't exist
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create user_presence table
CREATE TABLE IF NOT EXISTS user_presence (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('online', 'away', 'offline')),
  last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;

-- Allow users to read all presence data
CREATE POLICY "Allow users to read all presence data"
  ON user_presence
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow users to update only their own presence
CREATE POLICY "Allow users to update their own presence"
  ON user_presence
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow users to insert only their own presence
CREATE POLICY "Allow users to insert their own presence"
  ON user_presence
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update the updated_at timestamp
CREATE TRIGGER update_user_presence_updated_at
BEFORE UPDATE ON user_presence
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create function to check and update inactive users (to be called from the frontend)
CREATE OR REPLACE FUNCTION check_inactive_users()
RETURNS VOID AS $$
BEGIN
  UPDATE user_presence
  SET status = 'offline'
  WHERE status != 'offline' AND last_seen < NOW() - INTERVAL '5 minutes';
END;
$$ LANGUAGE plpgsql;

-- Create function to get user status with automatic offline detection
CREATE OR REPLACE FUNCTION get_user_status(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_status TEXT;
  v_last_seen TIMESTAMPTZ;
BEGIN
  -- Get the user's status and last_seen time
  SELECT status, last_seen INTO v_status, v_last_seen
  FROM user_presence
  WHERE user_id = p_user_id;

  -- If no record exists, return 'offline'
  IF v_status IS NULL THEN
    RETURN 'offline';
  END IF;

  -- If the user was last seen more than 5 minutes ago and is not already offline, return 'offline'
  IF v_last_seen < NOW() - INTERVAL '5 minutes' AND v_status != 'offline' THEN
    -- Update the status to offline
    UPDATE user_presence
    SET status = 'offline'
    WHERE user_id = p_user_id;

    RETURN 'offline';
  END IF;

  -- Otherwise, return the current status
  RETURN v_status;
END;
$$ LANGUAGE plpgsql;
