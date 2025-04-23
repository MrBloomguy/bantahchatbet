-- Enhance Challenge Chat System to match Bybit P2P trade chat experience

-- Add system_message type to challenge_messages if not already present
DO $$
BEGIN
    -- Check if we need to alter the type column
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'challenge_messages' 
        AND column_name = 'type'
        AND data_type = 'character varying'
    ) THEN
        -- Add type column or modify it
        ALTER TABLE public.challenge_messages 
        ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'text';
    END IF;

    -- Ensure the type column accepts system_message
    ALTER TABLE public.challenge_messages 
    DROP CONSTRAINT IF EXISTS challenge_messages_type_check;
    
    ALTER TABLE public.challenge_messages 
    ADD CONSTRAINT challenge_messages_type_check 
    CHECK (type IN ('text', 'image', 'evidence', 'system_message'));
END$$;

-- Create table for challenge evidence reviews
CREATE TABLE IF NOT EXISTS public.challenge_evidence_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID REFERENCES public.challenge_messages(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(message_id, user_id)
);

-- Create table for challenge disputes
CREATE TABLE IF NOT EXISTS public.challenge_disputes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    challenge_id UUID REFERENCES public.challenges(id) ON DELETE CASCADE,
    initiated_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    resolution TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create function to add system message to challenge chat
CREATE OR REPLACE FUNCTION add_challenge_system_message(
    p_challenge_id UUID,
    p_content TEXT,
    p_metadata JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_message_id UUID;
BEGIN
    INSERT INTO public.challenge_messages (
        challenge_id,
        sender_id,
        content,
        type,
        metadata
    ) VALUES (
        p_challenge_id,
        NULL, -- NULL sender indicates system message
        p_content,
        'system_message',
        p_metadata
    )
    RETURNING id INTO v_message_id;
    
    RETURN v_message_id;
END;
$$;

-- Create function to initiate a dispute
CREATE OR REPLACE FUNCTION initiate_challenge_dispute(
    p_challenge_id UUID,
    p_user_id UUID,
    p_reason TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_dispute_id UUID;
    v_user_name TEXT;
    v_challenge_record RECORD;
    v_other_user_id UUID;
BEGIN
    -- Check if user is part of the challenge
    SELECT * INTO v_challenge_record
    FROM public.challenges
    WHERE id = p_challenge_id;
    
    IF v_challenge_record IS NULL THEN
        RAISE EXCEPTION 'Challenge not found';
    END IF;
    
    IF v_challenge_record.challenger_id != p_user_id AND v_challenge_record.challenged_id != p_user_id THEN
        RAISE EXCEPTION 'User is not part of this challenge';
    END IF;
    
    -- Create dispute record
    INSERT INTO public.challenge_disputes (
        challenge_id,
        initiated_by,
        reason
    ) VALUES (
        p_challenge_id,
        p_user_id,
        p_reason
    )
    RETURNING id INTO v_dispute_id;
    
    -- Get user name for the message
    SELECT username INTO v_user_name
    FROM public.profiles
    WHERE id = p_user_id;
    
    -- Add system message
    PERFORM add_challenge_system_message(
        p_challenge_id,
        'Dispute initiated by ' || v_user_name || ': ' || p_reason,
        jsonb_build_object('dispute_id', v_dispute_id)
    );
    
    -- Determine the other user to notify
    IF v_challenge_record.challenger_id = p_user_id THEN
        v_other_user_id := v_challenge_record.challenged_id;
    ELSE
        v_other_user_id := v_challenge_record.challenger_id;
    END IF;
    
    -- Create notification for the other user
    INSERT INTO public.notifications (
        user_id,
        notification_type,
        title,
        content,
        metadata
    ) VALUES (
        v_other_user_id,
        'challenge_dispute',
        'Challenge Dispute Initiated',
        'A dispute has been initiated for your challenge: ' || COALESCE(v_challenge_record.title, 'Untitled Challenge'),
        jsonb_build_object(
            'challenge_id', p_challenge_id,
            'dispute_id', v_dispute_id
        )
    );
    
    -- Create notification for admins
    INSERT INTO public.notifications (
        user_id,
        notification_type,
        title,
        content,
        metadata
    )
    SELECT 
        id,
        'admin_challenge_dispute',
        'New Challenge Dispute',
        'A new dispute has been initiated for challenge: ' || COALESCE(v_challenge_record.title, 'Untitled Challenge'),
        jsonb_build_object(
            'challenge_id', p_challenge_id,
            'dispute_id', v_dispute_id
        )
    FROM auth.users
    WHERE is_admin = true;
    
    RETURN v_dispute_id;
END;
$$;

-- Create function to review evidence
CREATE OR REPLACE FUNCTION review_challenge_evidence(
    p_message_id UUID,
    p_user_id UUID,
    p_status VARCHAR,
    p_comment TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_message RECORD;
    v_user_name TEXT;
    v_challenge_id UUID;
BEGIN
    -- Get message details
    SELECT * INTO v_message
    FROM public.challenge_messages
    WHERE id = p_message_id;
    
    IF v_message IS NULL THEN
        RAISE EXCEPTION 'Message not found';
    END IF;
    
    v_challenge_id := v_message.challenge_id;
    
    -- Get user name
    SELECT username INTO v_user_name
    FROM public.profiles
    WHERE id = p_user_id;
    
    -- Insert or update review
    INSERT INTO public.challenge_evidence_reviews (
        message_id,
        user_id,
        status,
        comment
    ) VALUES (
        p_message_id,
        p_user_id,
        p_status,
        p_comment
    )
    ON CONFLICT (message_id, user_id) 
    DO UPDATE SET
        status = p_status,
        comment = p_comment,
        updated_at = NOW();
    
    -- Add system message about the review
    PERFORM add_challenge_system_message(
        v_challenge_id,
        v_user_name || ' has ' || 
        CASE 
            WHEN p_status = 'accepted' THEN 'accepted'
            WHEN p_status = 'rejected' THEN 'rejected'
            ELSE 'reviewed'
        END || 
        ' the evidence' || 
        CASE WHEN p_comment IS NOT NULL THEN ': ' || p_comment ELSE '' END,
        jsonb_build_object(
            'evidence_message_id', p_message_id,
            'review_status', p_status
        )
    );
    
    RETURN TRUE;
END;
$$;

-- Create function to add support to challenge chat
CREATE OR REPLACE FUNCTION add_support_to_challenge(
    p_challenge_id UUID,
    p_admin_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_admin_id UUID;
    v_admin_name TEXT;
BEGIN
    -- If no admin ID provided, select a random admin
    IF p_admin_id IS NULL THEN
        SELECT id INTO v_admin_id
        FROM auth.users
        WHERE is_admin = true
        ORDER BY RANDOM()
        LIMIT 1;
    ELSE
        v_admin_id := p_admin_id;
    END IF;
    
    -- Get admin name
    SELECT username INTO v_admin_name
    FROM public.profiles
    WHERE id = v_admin_id;
    
    -- Add system message
    PERFORM add_challenge_system_message(
        p_challenge_id,
        'Support agent ' || v_admin_name || ' has joined the chat',
        jsonb_build_object('admin_id', v_admin_id)
    );
    
    -- TODO: Add admin to chat participants if needed
    
    RETURN TRUE;
END;
$$;

-- Create function to handle challenge status changes
CREATE OR REPLACE FUNCTION handle_challenge_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Only proceed if status has changed
    IF NEW.status = OLD.status THEN
        RETURN NEW;
    END IF;
    
    -- Add system message about status change
    PERFORM add_challenge_system_message(
        NEW.id,
        'Challenge status changed to ' || NEW.status,
        jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status)
    );
    
    RETURN NEW;
END;
$$;

-- Create trigger for challenge status changes
DROP TRIGGER IF EXISTS challenge_status_change_trigger ON challenges;

CREATE TRIGGER challenge_status_change_trigger
AFTER UPDATE OF status ON challenges
FOR EACH ROW
EXECUTE FUNCTION handle_challenge_status_change();

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
