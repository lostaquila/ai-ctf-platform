-- Drop existing policies on events table
DROP POLICY IF EXISTS "Everyone can read events" ON events;
DROP POLICY IF EXISTS "Everyone can read active events" ON events;

-- Recreate policies with service role access
CREATE POLICY "Everyone can read events"
  ON events FOR SELECT
  USING (true);

CREATE POLICY "Service role can insert events"
  ON events FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update events"
  ON events FOR UPDATE
  USING (true);

CREATE POLICY "Service role can delete events"
  ON events FOR DELETE
  USING (true);
