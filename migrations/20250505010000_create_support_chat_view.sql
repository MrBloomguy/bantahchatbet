-- Drop view if it exists
DROP VIEW IF EXISTS public.support_messages_with_details;

-- Create view with user details and message info
CREATE OR REPLACE VIEW public.support_messages_with_details AS
SELECT 
    sm.*,
    u.raw_user_meta_data->>'name' as user_name,
    u.raw_user_meta_data->>'username' as username,
    u.raw_user_meta_data->>'avatar_url' as avatar_url,
    u.raw_user_meta_data->>'role' as user_role
FROM 
    public.support_messages sm
    LEFT JOIN auth.users u ON sm.user_id = u.id;

-- Grant access to authenticated users
GRANT SELECT ON public.support_messages_with_details TO authenticated;

-- Create policy for the view
CREATE POLICY "Users can view their support messages"
    ON public.support_messages_with_details
    FOR SELECT
    USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_user_meta_data->>'role' = 'support'
        )
    );

-- Force schema cache refresh
NOTIFY pgrst, 'reload schema';