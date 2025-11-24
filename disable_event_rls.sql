-- ============================================
-- DISABLE RLS ON EVENT TABLES
-- ============================================
-- Since authorization is handled in application code via
-- service role key and ADMIN_EMAILS, we don't need RLS

-- Disable RLS completely
ALTER TABLE events DISABLE ROW LEVEL SECURITY;
ALTER TABLE event_participants DISABLE ROW LEVEL SECURITY;

-- Drop all policies (they won't be used anyway)
DROP POLICY IF EXISTS "Everyone can read events" ON events;
DROP POLICY IF EXISTS "Everyone can read active events" ON events;
DROP POLICY IF EXISTS "Service role can insert events" ON events;
DROP POLICY IF EXISTS "Service role can update events" ON events;
DROP POLICY IF EXISTS "Service role can delete events" ON events;
DROP POLICY IF EXISTS "Allow all operations on events" ON events;
DROP POLICY IF EXISTS "events_all_access" ON events;

DROP POLICY IF EXISTS "Teams can join events" ON event_participants;
DROP POLICY IF EXISTS "Teams can view their joined events" ON event_participants;
DROP POLICY IF EXISTS "Allow authenticated users to manage event_participants" ON event_participants;
DROP POLICY IF EXISTS "event_participants_all_access" ON event_participants;

-- Grant permissions to all roles
GRANT ALL ON events TO anon;
GRANT ALL ON events TO authenticated;
GRANT ALL ON events TO service_role;

GRANT ALL ON event_participants TO anon;
GRANT ALL ON event_participants TO authenticated;
GRANT ALL ON event_participants TO service_role;

-- Verify
SELECT 
  tablename, 
  rowsecurity as "RLS Enabled"
FROM pg_tables 
WHERE tablename IN ('events', 'event_participants')
ORDER BY tablename;
