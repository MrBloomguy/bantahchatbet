-- Create user_points table
CREATE TABLE IF NOT EXISTS user_points (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    points INTEGER DEFAULT 0,
    level VARCHAR(50),
    last_action TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id)
);

-- Create user_badges table
CREATE TABLE IF NOT EXISTS user_badges (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    badge_name VARCHAR(100) NOT NULL,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    requirements_met JSONB
);

-- Create trigger to notify on points update
CREATE OR REPLACE FUNCTION notify_points_update()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO notifications (
        user_id,
        type,
        title,
        content,
        metadata
    ) VALUES (
        NEW.user_id,
        'points_update',
        'Points Earned!',
        'You earned points for: ' || NEW.last_action,
        jsonb_build_object(
            'points', NEW.points - COALESCE(OLD.points, 0),
            'action', NEW.last_action,
            'total_points', NEW.points
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER points_update_trigger
    AFTER UPDATE OR INSERT ON user_points
    FOR EACH ROW
    WHEN (NEW.points > COALESCE(OLD.points, 0))
    EXECUTE FUNCTION notify_points_update();