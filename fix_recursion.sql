-- Fix Infinite Recursion Error
-- The policy "See team members" causes recursion because it queries the profiles table while checking permissions for the profiles table.
-- Since profiles are intended to be public (per SCHEMA.md), we can simply drop this redundant policy.

DROP POLICY IF EXISTS "See team members" ON public.profiles;

-- Ensure the public policy exists and is correct
-- This allows everyone to read profiles, which avoids the need for complex recursive checks
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
