-- Complete Hints System Setup
-- This creates both tables needed for the hints system

-- 1. Create simulation_hints table (stores hint content)
CREATE TABLE IF NOT EXISTS public.simulation_hints (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    simulation_id uuid REFERENCES public.simulations(id) ON DELETE CASCADE NOT NULL,
    hint_index integer CHECK (hint_index IN (1, 2, 3)) NOT NULL,
    content text NOT NULL,
    cost integer NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(simulation_id, hint_index)
);

-- 2. Create unlocked_hints table (tracks which teams unlocked which hints)
CREATE TABLE IF NOT EXISTS public.unlocked_hints (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
    simulation_id uuid REFERENCES public.simulations(id) ON DELETE CASCADE NOT NULL,
    hint_index integer CHECK (hint_index IN (1, 2, 3)) NOT NULL,
    unlocked_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(team_id, simulation_id, hint_index)
);

-- 3. Enable RLS
ALTER TABLE public.simulation_hints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unlocked_hints ENABLE ROW LEVEL SECURITY;

-- 4. Grant Permissions
GRANT ALL ON public.simulation_hints TO service_role;
GRANT SELECT ON public.simulation_hints TO authenticated;
GRANT SELECT ON public.simulation_hints TO anon;

GRANT ALL ON public.unlocked_hints TO service_role;
GRANT SELECT ON public.unlocked_hints TO authenticated;

-- 5. Create RLS Policies
-- Allow authenticated users to view hints (content is public once unlocked)
CREATE POLICY "Allow authenticated to view hints" ON public.simulation_hints
    FOR SELECT
    TO authenticated
    USING (true);

-- Allow team members to view their unlocked hints
CREATE POLICY "Allow team members to view unlocked hints" ON public.unlocked_hints
    FOR SELECT
    TO authenticated
    USING (
        team_id IN (
            SELECT team_id FROM public.profiles WHERE id = auth.uid()
        )
    );

-- 6. Force Schema Cache Reload
NOTIFY pgrst, 'reload config';
