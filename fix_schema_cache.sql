-- 1. Ensure Columns Exist
ALTER TABLE public.simulations ADD COLUMN IF NOT EXISTS hint_1 text;
ALTER TABLE public.simulations ADD COLUMN IF NOT EXISTS hint_2 text;
ALTER TABLE public.simulations ADD COLUMN IF NOT EXISTS hint_3 text;

-- 2. Ensure Unlocked Hints Table Exists
CREATE TABLE IF NOT EXISTS public.unlocked_hints (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  simulation_id uuid REFERENCES public.simulations(id) ON DELETE CASCADE NOT NULL,
  hint_index integer CHECK (hint_index IN (1, 2, 3)) NOT NULL,
  unlocked_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(team_id, simulation_id, hint_index)
);

-- 3. Ensure RLS is Enabled
ALTER TABLE public.unlocked_hints ENABLE ROW LEVEL SECURITY;

-- 4. Ensure Permissions
GRANT ALL ON public.unlocked_hints TO service_role;
GRANT SELECT ON public.unlocked_hints TO authenticated;

-- 5. Force PostgREST Schema Cache Reload
-- This is the critical step for the "schema cache" error
NOTIFY pgrst, 'reload config';
