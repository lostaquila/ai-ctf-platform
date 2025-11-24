-- Fix permissions for event_participants table

-- Grant direct table permissions
GRANT ALL ON event_participants TO authenticated;
GRANT ALL ON event_participants TO service_role;

-- Drop existing policies
DROP POLICY IF EXISTS "Teams can join events" ON event_participants;
DROP POLICY IF EXISTS "Teams can view their joined events" ON event_participants;

-- Create permissive policies
CREATE POLICY "Allow authenticated users to manage event_participants"
  ON event_participants
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Also ensure the events table is fully accessible
GRANT ALL ON events TO authenticated;
GRANT ALL ON events TO service_role;

-- Verify the changes
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('events', 'event_participants');

SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename IN ('events', 'event_participants');
