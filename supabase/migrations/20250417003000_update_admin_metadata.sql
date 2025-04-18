-- Create function to validate admin status
CREATE OR REPLACE FUNCTION is_admin(p_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM auth.users 
        WHERE email = p_email 
        AND (
            raw_user_meta_data->>'is_admin' = 'true'
            OR
            raw_user_meta_data->>'role' = 'admin'
        )
    );
END;
$$;

-- Update admin user metadata
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Update admin users to have proper metadata
    UPDATE auth.users
    SET raw_user_meta_data = raw_user_meta_data || 
        jsonb_build_object(
            'is_admin', 'true',
            'role', 'admin'
        )
    WHERE email IN ('alwaysdefi16@gmail.com', 'michealwritesyes@gmail.com')
    OR raw_user_meta_data->>'is_admin' = 'true';

    -- Verify the update
    RAISE NOTICE 'Admin users after update:';
    FOR r IN
        SELECT 
            email,
            raw_user_meta_data->>'is_admin' as is_admin,
            raw_user_meta_data->>'role' as role
        FROM auth.users
        WHERE email IN ('alwaysdefi16@gmail.com', 'michealwritesyes@gmail.com')
        OR raw_user_meta_data->>'is_admin' = 'true'
    LOOP
        RAISE NOTICE 'Email: %, Is Admin: %, Role: %',
            r.email, r.is_admin, r.role;
    END LOOP;
END $$;