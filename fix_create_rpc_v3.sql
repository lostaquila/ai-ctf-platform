-- Create V3 Create Function (Simpler Name)
CREATE OR REPLACE FUNCTION public.create_simulation_v3(
    p_title text,
    p_description text,
    p_system_prompt text,
    p_flag_code text,
    p_type text,
    p_hint_1 text DEFAULT NULL,
    p_hint_2 text DEFAULT NULL,
    p_hint_3 text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_id uuid;
BEGIN
    INSERT INTO public.simulations (
        title, description, system_prompt, flag_code, type, hint_1, hint_2, hint_3
    ) VALUES (
        p_title, p_description, p_system_prompt, p_flag_code, p_type, p_hint_1, p_hint_2, p_hint_3
    )
    RETURNING id INTO v_id;

    RETURN v_id;
END;
$$;

-- Grant Wide Permissions
GRANT EXECUTE ON FUNCTION public.create_simulation_v3(text, text, text, text, text, text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.create_simulation_v3(text, text, text, text, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_simulation_v3(text, text, text, text, text, text, text, text) TO anon;

-- Force Reload
NOTIFY pgrst, 'reload config';
