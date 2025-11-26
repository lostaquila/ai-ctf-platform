-- ============================================
-- TIME-BASED LEADERBOARD TIEBREAKING
-- ============================================
-- This migration adds timestamp tracking for score changes
-- to enable fair tiebreaking based on who reached a score first.

-- 1. Add last_score_at column to teams table
ALTER TABLE teams 
ADD COLUMN IF NOT EXISTS last_score_at timestamp with time zone DEFAULT timezone('utc'::text, now());

-- 2. Update existing teams to have their last_score_at set to created_at
-- (This ensures existing teams have a reasonable initial value)
UPDATE teams 
SET last_score_at = created_at 
WHERE last_score_at IS NULL;

-- 3. Create a trigger function that automatically updates last_score_at
-- whenever the score column changes
CREATE OR REPLACE FUNCTION update_last_score_at()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update if the score actually changed
    IF NEW.score IS DISTINCT FROM OLD.score THEN
        NEW.last_score_at = timezone('utc'::text, now());
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Create the trigger on the teams table
DROP TRIGGER IF EXISTS teams_score_update_trigger ON teams;

CREATE TRIGGER teams_score_update_trigger
    BEFORE UPDATE ON teams
    FOR EACH ROW
    EXECUTE FUNCTION update_last_score_at();

-- 5. Verify the setup
SELECT 
    column_name, 
    data_type, 
    column_default
FROM information_schema.columns
WHERE table_name = 'teams' 
  AND column_name IN ('score', 'last_score_at')
ORDER BY ordinal_position;

-- Show existing triggers
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'teams';
