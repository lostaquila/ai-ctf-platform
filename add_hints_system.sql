-- 1. Add Hint Columns to Simulations Table
ALTER TABLE public.simulations
ADD COLUMN hint_1 text,
ADD COLUMN hint_2 text,
ADD COLUMN hint_3 text;

-- 2. Create Unlocked Hints Table
CREATE TABLE public.unlocked_hints (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  simulation_id uuid REFERENCES public.simulations(id) ON DELETE CASCADE NOT NULL,
  hint_index integer CHECK (hint_index IN (1, 2, 3)) NOT NULL,
  unlocked_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(team_id, simulation_id, hint_index)
);

-- 3. Enable RLS
ALTER TABLE public.unlocked_hints ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies

-- Allow users to view hints unlocked by their team
CREATE POLICY "View team unlocked hints" ON public.unlocked_hints
FOR SELECT
USING (
  team_id IN (
    SELECT team_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- Grant permissions
GRANT ALL ON public.unlocked_hints TO service_role;
GRANT SELECT ON public.unlocked_hints TO authenticated;
