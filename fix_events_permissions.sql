-- First, let's check the current state
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'events';

-- Disable RLS temporarily to test
ALTER TABLE events DISABLE ROW LEVEL SECURITY;

-- If that works, we can re-enable it with better policies
-- Or we can grant direct permissions to the service role

-- Alternative: Grant direct table permissions to authenticated role
GRANT ALL ON events TO authenticated;
GRANT ALL ON events TO service_role;

-- Re-enable RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Everyone can read events" ON events;
DROP POLICY IF EXISTS "Everyone can read active events" ON events;
DROP POLICY IF EXISTS "Service role can insert events" ON events;
DROP POLICY IF EXISTS "Service role can update events" ON events;
DROP POLICY IF EXISTS "Service role can delete events" ON events;

-- Create a single permissive policy for all operations
CREATE POLICY "Allow all operations on events"
  ON events
  FOR ALL
  USING (true)
  WITH CHECK (true);
