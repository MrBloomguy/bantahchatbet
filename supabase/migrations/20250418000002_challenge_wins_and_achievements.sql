-- Challenge wins and achievements

-- Award points for winning challenges
CREATE OR REPLACE FUNCTION award_challenge_win_points() RETURNS TRIGGER AS $$
BEGIN
    -- Only award points when challenge is completed and has a winner
    IF NEW.status = 'completed' AND NEW.winner_id IS NOT NULL THEN
        -- Award points to winner (50 points per win)
        PERFORM award_points(
            NEW.winner_id,
            50,
            'challenge_win',
            'Points awarded for winning a challenge',
            jsonb_build_object('challenge_id', NEW.id)
        );
        
        -- Create achievement if this is their 5th win
        WITH win_count AS (
            SELECT COUNT(*) as wins
            FROM challenges
            WHERE winner_id = NEW.winner_id
        )
        SELECT 
            CASE 
                WHEN wins = 5 THEN
                    -- Award bonus points for 5 wins achievement
                    PERFORM award_points(
                        NEW.winner_id,
                        250,
                        'achievement_unlock',
                        'Achievement unlocked: Win 5 challenges',
                        jsonb_build_object('achievement', 'challenge_master')
                    );
                ELSE NULL
            END
        FROM win_count;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER award_challenge_win_points_trigger
    AFTER UPDATE OF status, winner_id ON challenges
    FOR EACH ROW
    EXECUTE FUNCTION award_challenge_win_points();

-- Create view for user achievements
CREATE OR REPLACE VIEW user_achievements AS
WITH user_stats AS (
    SELECT 
        u.id as user_id,
        u.reputation_score,
        COUNT(DISTINCT e.id) as events_created,
        COUNT(DISTINCT ep.event_id) as events_participated,
        COUNT(DISTINCT c.id) FILTER (WHERE c.winner_id = u.id) as challenges_won,
        COUNT(DISTINCT c2.id) as challenges_created,
        COUNT(DISTINCT t.id) FILTER (WHERE t.type = 'deposit' AND t.status = 'completed') as deposits_made,
        COUNT(DISTINCT ref.id) as referrals
    FROM users u
    LEFT JOIN events e ON e.creator_id = u.id
    LEFT JOIN event_participants ep ON ep.user_id = u.id
    LEFT JOIN challenges c ON c.winner_id = u.id
    LEFT JOIN challenges c2 ON c2.challenger_id = u.id
    LEFT JOIN transactions t ON t.user_id = u.id
    LEFT JOIN auth.users ref ON ref.raw_user_meta_data->>'referred_by' = u.id::text
    GROUP BY u.id
)
SELECT 
    user_id,
    jsonb_build_object(
        'level', FLOOR(reputation_score / 500),
        'total_points', reputation_score,
        'events_created', events_created,
        'events_participated', events_participated,
        'challenges_won', challenges_won,
        'challenges_created', challenges_created,
        'deposits_made', deposits_made,
        'referrals', referrals,
        'achievements', jsonb_build_array(
            CASE WHEN events_created >= 5 THEN 'Event Creator' END,
            CASE WHEN events_participated >= 5 THEN 'Active Participant' END,
            CASE WHEN challenges_won >= 5 THEN 'Challenge Master' END,
            CASE WHEN challenges_created >= 5 THEN 'Challenge Creator' END,
            CASE WHEN deposits_made >= 1 THEN 'First Deposit' END,
            CASE WHEN referrals >= 1 THEN 'Community Builder' END
        ) - jsonb '["null"]'
    ) as achievements
FROM user_stats;

-- Grant access to the view
GRANT SELECT ON user_achievements TO authenticated;