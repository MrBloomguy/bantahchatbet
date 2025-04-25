-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS get_profile_by_identifier(TEXT);

-- Create a function to get a user's profile by username or ID
CREATE FUNCTION get_profile_by_identifier(p_username TEXT)
RETURNS TABLE (
  user_id UUID,
  user_followers_count BIGINT,
  user_following_count BIGINT,
  user_is_following BOOLEAN
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_id UUID;
  v_current_user_id UUID;
BEGIN
  -- Get the current authenticated user ID
  v_current_user_id := auth.uid();

  -- Try to find the user by username or ID
  BEGIN
    -- First try to parse as UUID (for ID lookup)
    v_user_id := p_username::UUID;
  EXCEPTION WHEN OTHERS THEN
    -- If not a valid UUID, look up by username
    SELECT id INTO v_user_id
    FROM users
    WHERE username = p_username;
  END;

  -- If user not found, return empty result
  IF v_user_id IS NULL THEN
    RETURN;
  END IF;

  -- Return the profile data
  RETURN QUERY
  SELECT
    v_user_id AS user_id,
    COALESCE((SELECT COUNT(*) FROM followers WHERE following_id = v_user_id), 0) AS user_followers_count,
    COALESCE((SELECT COUNT(*) FROM followers WHERE follower_id = v_user_id), 0) AS user_following_count,
    CASE
      WHEN v_current_user_id IS NULL THEN FALSE
      ELSE EXISTS (
        SELECT 1 FROM followers
        WHERE follower_id = v_current_user_id AND following_id = v_user_id
      )
    END AS user_is_following;
END;
$$;

-- Grant access to the function
GRANT EXECUTE ON FUNCTION get_profile_by_identifier(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_profile_by_identifier(TEXT) TO anon;

-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS ensure_user_stats(UUID);

-- Create a function to ensure user stats exist
CREATE FUNCTION ensure_user_stats(p_user_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO user_stats (user_id, events_won, events_participated, total_earnings)
  VALUES (p_user_id, 0, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;
END;
$$;

-- Grant access to the function
GRANT EXECUTE ON FUNCTION ensure_user_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION ensure_user_stats(UUID) TO anon;
