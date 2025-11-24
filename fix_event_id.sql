-- Check current state of simulations
SELECT id, title, type, event_id 
FROM simulations 
ORDER BY created_at;

-- Ensure all existing practice simulations have event_id = NULL
-- (This should already be the case, but let's make sure)
UPDATE simulations 
SET event_id = NULL 
WHERE type = 'practice' AND event_id IS NOT NULL;

-- Verify the fix
SELECT id, title, type, event_id 
FROM simulations 
WHERE type = 'practice'
ORDER BY created_at;
