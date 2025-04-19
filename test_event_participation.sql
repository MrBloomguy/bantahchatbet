-- Create test event and participant
DO $$
DECLARE
    test_user_id uuid := '11111111-1111-1111-1111-111111111111';
    participant_id uuid := '22222222-2222-2222-2222-222222222222';
    test_event_id uuid;
BEGIN
    -- Insert test user if not exists
    INSERT INTO users (id, username, name)
    VALUES 
        (test_user_id, 'testuser', 'Test User'),
        (participant_id, 'participant', 'Test Participant')
    ON CONFLICT (id) DO NOTHING;

    -- Create test event
    INSERT INTO events (
        title,
        description,
        category,
        start_time,
        end_time,
        wager_amount,
        max_participants,
        creator_id,
        status
    ) VALUES (
        'Test Event 2',
        'Test Description',
        'sports',
        NOW() + interval '1 day',
        NOW() + interval '2 days',
        100,  -- wager amount
        10,
        test_user_id,
        'active'
    ) RETURNING id INTO test_event_id;

    -- Insert participation record
    INSERT INTO event_participants (
        event_id,
        user_id,
        prediction,
        status,
        wager_amount
    ) VALUES (
        test_event_id,
        participant_id,
        true,  -- predicting "yes"
        'pending',
        100    -- same as event wager_amount
    );
END $$;

-- Verify the event and pool
SELECT 
    e.title,
    e.wager_amount as event_wager_amount,
    p.total_amount,
    p.platform_fee,
    p.winning_pool,
    p.losing_pool,
    p.status as pool_status,
    COUNT(ep.id) as participant_count,
    SUM(ep.wager_amount) as total_wagered
FROM events e
JOIN event_pools p ON e.id = p.event_id
LEFT JOIN event_participants ep ON e.id = ep.event_id
WHERE e.title = 'Test Event 2'
GROUP BY e.title, e.wager_amount, p.total_amount, p.platform_fee, p.winning_pool, p.losing_pool, p.status;
