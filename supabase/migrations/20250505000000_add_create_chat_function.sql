-- Create a function to create a new chat between two users
CREATE OR REPLACE FUNCTION create_chat(p_user_id UUID, p_other_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_chat_id UUID;
  v_result JSONB;
  v_chat_exists BOOLEAN := FALSE;
BEGIN
  -- Check if a chat already exists between these users
  SELECT c.id INTO v_chat_id
  FROM chats c
  JOIN chat_participants cp1 ON c.id = cp1.chat_id AND cp1.user_id = p_user_id
  JOIN chat_participants cp2 ON c.id = cp2.chat_id AND cp2.user_id = p_other_user_id
  LIMIT 1;

  -- If chat exists, set the flag
  IF v_chat_id IS NOT NULL THEN
    v_chat_exists := TRUE;
  ELSE
    -- Create a new chat
    INSERT INTO chats (created_at, updated_at)
    VALUES (NOW(), NOW())
    RETURNING id INTO v_chat_id;

    -- Add both users as participants
    INSERT INTO chat_participants (chat_id, user_id)
    VALUES
      (v_chat_id, p_user_id),
      (v_chat_id, p_other_user_id);
  END IF;

  -- Return the chat ID and status
  v_result := jsonb_build_object(
    'chat_id', v_chat_id,
    'created_now', NOT v_chat_exists,
    'already_existed', v_chat_exists
  );

  RETURN v_result;
END;
$$;
