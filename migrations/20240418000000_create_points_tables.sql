-- Create points table to track user points
CREATE TABLE IF NOT EXISTS user_points (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    total_points INTEGER NOT NULL DEFAULT 0,
    current_level INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create points history table
CREATE TABLE IF NOT EXISTS points_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    points INTEGER NOT NULL,
    action_type TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own points"
    ON user_points FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can view their points history"
    ON points_history FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Create points triggers to handle points updates and notifications
CREATE OR REPLACE FUNCTION handle_points_update()
RETURNS TRIGGER AS $$
DECLARE
    old_level INTEGER;
    new_level INTEGER;
    points_needed INTEGER;
BEGIN
    -- Calculate levels (100 points per level)
    old_level := COALESCE((OLD.total_points / 100) + 1, 1);
    new_level := (NEW.total_points / 100) + 1;
    
    -- Update the level if changed
    IF new_level != old_level THEN
        NEW.current_level := new_level;
        
        -- Create level up notification
        INSERT INTO notifications (
            user_id,
            type,
            title,
            content,
            metadata
        ) VALUES (
            NEW.user_id,
            'level_up',
            'Level Up! 🎉',
            format('Congratulations! You''ve reached level %s', new_level),
            jsonb_build_object(
                'old_level', old_level,
                'new_level', new_level,
                'points_needed', (new_level * 100) - NEW.total_points
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for points updates
DROP TRIGGER IF EXISTS on_points_update ON user_points;
CREATE TRIGGER on_points_update
    BEFORE UPDATE OF total_points
    ON user_points
    FOR EACH ROW
    EXECUTE FUNCTION handle_points_update();

-- Create function to award points
CREATE OR REPLACE FUNCTION award_points(
    user_id_param UUID,
    points_param INTEGER,
    action_type_param TEXT,
    metadata_param JSONB DEFAULT '{}'
)
RETURNS void AS $$
BEGIN
    -- Insert into points history
    INSERT INTO points_history (user_id, points, action_type, metadata)
    VALUES (user_id_param, points_param, action_type_param, metadata_param);
    
    -- Update total points
    INSERT INTO user_points (user_id, total_points)
    VALUES (user_id_param, points_param)
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        total_points = user_points.total_points + points_param,
        updated_at = NOW();
        
    -- Create points earned notification
    INSERT INTO notifications (
        user_id,
        type,
        title,
        content,
        metadata
    ) VALUES (
        user_id_param,
        'points_earned',
        'Points Earned! ⭐',
        format('You earned %s points for %s', points_param, action_type_param),
        jsonb_build_object(
            'points', points_param,
            'action_type', action_type_param
        ) || metadata_param
    );
END;
$$ LANGUAGE plpgsql;

-- Add points-related notification types
DO $$ 
BEGIN
    ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'points_earned';
    ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'level_up';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;