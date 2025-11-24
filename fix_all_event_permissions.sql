-- ============================================
-- COMPREHENSIVE FIX FOR ALL EVENT TABLES
-- ============================================

-- 1. GRANT DIRECT PERMISSIONS TO ALL ROLES
-- ============================================

GRANT ALL ON events TO authenticated;
GRANT ALL ON events TO service_role;
GRANT ALL ON events TO anon;

GRANT ALL ON event_participants TO authenticated;
GRANT ALL ON event_participants TO service_role;
GRANT ALL ON event_participants TO anon;

-- 2. DROP ALL EXISTING POLICIES
-- ============================================

-- Events policies
DROP POLICY IF EXISTS "Everyone can read events" ON events;
DROP POLICY IF EXISTS "Everyone can read active events" ON events;
DROP POLICY IF EXISTS "Service role can insert events" ON events;
DROP POLICY IF EXISTS "Service role can update events" ON events;
DROP POLICY IF EXISTS "Service role can delete events" ON events;
DROP POLICY IF EXISTS "Allow all operations on events" ON events;

-- Event participants policies
DROP POLICY IF EXISTS "Teams can join events" ON event_participants;
DROP POLICY IF EXISTS "Teams can view their joined events" ON event_participants;
DROP POLICY IF EXISTS "Allow authenticated users to manage event_participants" ON event_participants;

-- 3. CREATE SIMPLE PERMISSIVE POLICIES
-- ============================================

-- Events: Allow all operations for everyone (since admin auth is handled in code)
CREATE POLICY "events_all_access"
  ON events
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Event Participants: Allow all operations for authenticated users
CREATE POLICY "event_participants_all_access"
  ON event_participants
  FOR ALL
  USING (auth.role() = 'authenticated' OR auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- 4. VERIFY THE SETUP
-- ============================================

SELECT 
  tablename, 
  rowsecurity,
  (SELECT COUNT(*) FROM pg_policies WHERE pg_policies.tablename = pg_tables.tablename) as policy_count
FROM pg_tables 
WHERE tablename IN ('events', 'event_participants')
ORDER BY tablename;

SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive,
  cmd
FROM pg_policies
WHERE tablename IN ('events', 'event_participants')
ORDER BY tablename, policyname;
