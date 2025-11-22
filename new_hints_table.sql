-- Create a separate table for hints to bypass the 'simulations' table cache issue
CREATE TABLE IF NOT EXISTS public.simulation_hints (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    simulation_id uuid REFERENCES public.simulations(id) ON DELETE CASCADE NOT NULL,
    hint_index integer CHECK (hint_index IN (1, 2, 3)) NOT NULL,
    content text NOT NULL,
    cost integer NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(simulation_id, hint_index)
);

-- Enable RLS
ALTER TABLE public.simulation_hints ENABLE ROW LEVEL SECURITY;

-- Grant Permissions
GRANT ALL ON public.simulation_hints TO service_role;
GRANT SELECT ON public.simulation_hints TO authenticated;
GRANT SELECT ON public.simulation_hints TO anon;

-- Force Reload (just in case)
NOTIFY pgrst, 'reload config';
