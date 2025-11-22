-- 1. Ensure Schema Permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- 2. Create Simple Test Function
CREATE OR REPLACE FUNCTION public.test_connection()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN 'Connection Successful';
END;
$$;

GRANT EXECUTE ON FUNCTION public.test_connection() TO anon, authenticated, service_role;

-- 3. Create V3 Update Function (Simpler Name)
CREATE OR REPLACE FUNCTION public.update_simulation_v3(
    p_id uuid,
    p_title text,
    p_description text,
    p_system_prompt text,
    p_flag_code text,
    p_type text,
    p_hint_1 text DEFAULT NULL,
    p_hint_2 text DEFAULT NULL,
    p_hint_3 text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.simulations
    SET 
        title = p_title,
        description = p_description,
        system_prompt = p_system_prompt,
        flag_code = p_flag_code,
        type = p_type,
        hint_1 = p_hint_1,
        hint_2 = p_hint_2,
        hint_3 = p_hint_3
    WHERE id = p_id;

    RETURN FOUND;
END;
$$;

-- 4. Grant Wide Permissions
GRANT EXECUTE ON FUNCTION public.update_simulation_v3(uuid, text, text, text, text, text, text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.update_simulation_v3(uuid, text, text, text, text, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_simulation_v3(uuid, text, text, text, text, text, text, text, text) TO anon;

-- 5. Force Reload
NOTIFY pgrst, 'reload config';
