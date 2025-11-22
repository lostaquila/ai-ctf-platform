-- Redesigned Hints System Schema
-- Using new table names to avoid schema cache collisions

-- 1. Challenge Hints Table (Stores the content)
CREATE TABLE IF NOT EXISTS public.challenge_hints (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    simulation_id uuid REFERENCES public.simulations(id) ON DELETE CASCADE NOT NULL,
    hint_index integer CHECK (hint_index IN (1, 2, 3)) NOT NULL,
    content text NOT NULL,
    cost integer NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(simulation_id, hint_index)
);

-- 2. Team Hint Unlocks Table (Tracks unlocks)
CREATE TABLE IF NOT EXISTS public.team_hint_unlocks (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
    hint_id uuid REFERENCES public.challenge_hints(id) ON DELETE CASCADE NOT NULL,
    unlocked_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(team_id, hint_id)
);

-- 3. Enable RLS
ALTER TABLE public.challenge_hints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_hint_unlocks ENABLE ROW LEVEL SECURITY;

-- 4. Grant Permissions
GRANT ALL ON public.challenge_hints TO service_role;
GRANT SELECT ON public.challenge_hints TO authenticated;
GRANT SELECT ON public.challenge_hints TO anon;

GRANT ALL ON public.team_hint_unlocks TO service_role;
GRANT SELECT ON public.team_hint_unlocks TO authenticated;

-- 5. RLS Policies

-- Challenge Hints: Public read (content is technically public but UI hides it)
-- We rely on the API logic to only show content if unlocked, but for simplicity/cache avoidance
-- we allow read access. Sensitive logic is handled in the server action.
CREATE POLICY "Allow authenticated to read hints" ON public.challenge_hints
    FOR SELECT TO authenticated USING (true);

-- Team Unlocks: Members can see their team's unlocks
CREATE POLICY "Allow team members to view unlocks" ON public.team_hint_unlocks
    FOR SELECT TO authenticated
    USING (
        team_id IN (
            SELECT team_id FROM public.profiles WHERE id = auth.uid()
        )
    );

-- Force reload config
NOTIFY pgrst, 'reload config';
