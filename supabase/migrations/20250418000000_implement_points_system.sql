-- Points system implementation

-- Create an audit table to track point transactions
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
CREATE INDEX idx_point_transactions_user_id ON point_transactions(user_id);

-- Enable RLS
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own point transactions"
    ON point_transactions FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Create function to award points
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

-- Create triggers for automatic point awards

-- Event creation points (first 5 events)
CREATE OR REPLACE FUNCTION award_event_creation_points() RETURNS TRIGGER AS $$
DECLARE
    event_count INTEGER;
BEGIN
    -- Count how many events this user has created
    SELECT COUNT(*) INTO event_count
    FROM events
    WHERE creator_id = NEW.creator_id;
    
    -- Award points for first 5 events
    IF event_count <= 5 THEN
        PERFORM award_points(
            NEW.creator_id,
            50,
            'event_creation',
            'Points awarded for creating event #' || event_count,
            jsonb_build_object('event_id', NEW.id, 'event_count', event_count)
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER award_event_creation_points_trigger
    AFTER INSERT ON events
    FOR EACH ROW
    EXECUTE FUNCTION award_event_creation_points();

-- Event participation points
CREATE OR REPLACE FUNCTION award_event_participation_points() RETURNS TRIGGER AS $$
DECLARE
    participation_count INTEGER;
BEGIN
    -- Count participations for this user
    SELECT COUNT(*) INTO participation_count
    FROM event_participants
    WHERE user_id = NEW.user_id;
    
    -- Award points for first 5 participations
    IF participation_count <= 5 THEN
        PERFORM award_points(
            NEW.user_id,
            30,
            'event_participation',
            'Points awarded for joining event #' || participation_count,
            jsonb_build_object('event_id', NEW.event_id, 'participation_count', participation_count)
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER award_event_participation_points_trigger
    AFTER INSERT ON event_participants
    FOR EACH ROW
    EXECUTE FUNCTION award_event_participation_points();

-- Challenge points
CREATE OR REPLACE FUNCTION award_challenge_points() RETURNS TRIGGER AS $$
DECLARE
    challenge_count INTEGER;
BEGIN
    -- Count challenges for this user
    SELECT COUNT(*) INTO challenge_count
    FROM challenges
    WHERE challenger_id = NEW.challenger_id;
    
    -- Award points for first 5 challenges
    IF challenge_count <= 5 THEN
        PERFORM award_points(
            NEW.challenger_id,
            40,
            'challenge_creation',
            'Points awarded for creating challenge #' || challenge_count,
            jsonb_build_object('challenge_id', NEW.id, 'challenge_count', challenge_count)
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER award_challenge_points_trigger
    AFTER INSERT ON challenges
    FOR EACH ROW
    EXECUTE FUNCTION award_challenge_points();

-- Referral points
CREATE OR REPLACE FUNCTION award_referral_points() RETURNS TRIGGER AS $$
BEGIN
    -- Award points to the referrer (if exists)
    IF NEW.raw_user_meta_data->>'referred_by' IS NOT NULL THEN
        PERFORM award_points(
            (NEW.raw_user_meta_data->>'referred_by')::uuid,
            100,
            'referral_bonus',
            'Points awarded for referring a new user',
            jsonb_build_object('referred_user_id', NEW.id)
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER award_referral_points_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION award_referral_points();

-- Create function to check milestones and award bonus points
CREATE OR REPLACE FUNCTION check_user_milestones(user_id UUID) RETURNS void AS $$
DECLARE
    total_points INTEGER;
    current_level INTEGER;
    next_level_threshold INTEGER;
BEGIN
    -- Get user's current total points
    SELECT reputation_score INTO total_points
    FROM users
    WHERE id = user_id;
    
    -- Calculate current level (every 500 points = 1 level)
    current_level := total_points / 500;
    next_level_threshold := (current_level + 1) * 500;
    
    -- If user has reached a new level threshold
    IF total_points >= next_level_threshold THEN
        -- Award level up bonus
        PERFORM award_points(
            user_id,
            100,
            'level_up_bonus',
            'Bonus points awarded for reaching level ' || (current_level + 1),
            jsonb_build_object('new_level', current_level + 1)
        );
        
        -- Create a notification for the level up
        INSERT INTO notifications (
            user_id,
            type,
            title,
            content,
            metadata
        ) VALUES (
            user_id,
            'milestone',
            'Level Up! 🎉',
            'Congratulations! You''ve reached level ' || (current_level + 1),
            jsonb_build_object('level', current_level + 1, 'points', total_points)
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to check milestones when points are awarded
CREATE OR REPLACE FUNCTION check_milestones_on_points_update() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.reputation_score <> OLD.reputation_score THEN
        PERFORM check_user_milestones(NEW.id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER check_milestones_trigger
    AFTER UPDATE OF reputation_score ON users
    FOR EACH ROW
    EXECUTE FUNCTION check_milestones_on_points_update();

-- Grant necessary permissions
GRANT ALL ON point_transactions TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;