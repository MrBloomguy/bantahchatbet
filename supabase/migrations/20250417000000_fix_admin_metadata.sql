-- Update user metadata to include admin status
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || 
    jsonb_build_object('is_admin', CASE 
        WHEN email IN ('alwaysdefi16@gmail.com', 'michealwritesyes@gmail.com') 
        OR raw_user_meta_data->>'is_admin' = 'true'
        THEN 'true'
        ELSE 'false'
    END);

-- Verify the admin status is properly set
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Log the current admin users
    RAISE NOTICE 'Current admin users:';
    FOR r IN
        SELECT email, raw_user_meta_data->>'is_admin' as is_admin
        FROM auth.users
        WHERE raw_user_meta_data->>'is_admin' = 'true'
    LOOP
        RAISE NOTICE 'Email: %, Is Admin: %', r.email, r.is_admin;
    END LOOP;
END $$;