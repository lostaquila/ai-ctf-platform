-- Restore Profiles for Existing Auth Users
-- Run this if you have users in auth.users but no corresponding row in public.profiles

INSERT INTO public.profiles (id, username)
SELECT 
  id, 
  COALESCE(raw_user_meta_data->>'username', 'User ' || substr(id::text, 1, 8))
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- Verification
SELECT count(*) as profiles_restored FROM public.profiles;
