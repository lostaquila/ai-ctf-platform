-- 1. Drop existing functions to ensure clean slate
DROP FUNCTION IF EXISTS public.admin_create_simulation;
DROP FUNCTION IF EXISTS public.admin_update_simulation;

-- 2. Recreate Create Function
CREATE OR REPLACE FUNCTION public.admin_create_simulation(
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

-- 3. Recreate Update Function
CREATE OR REPLACE FUNCTION public.admin_update_simulation(
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

-- 4. Grant Permissions (Explicitly)
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON FUNCTION public.admin_create_simulation TO service_role;
GRANT ALL ON FUNCTION public.admin_create_simulation TO authenticated;
GRANT ALL ON FUNCTION public.admin_update_simulation TO service_role;
GRANT ALL ON FUNCTION public.admin_update_simulation TO authenticated;

-- 5. Force Schema Cache Reload
NOTIFY pgrst, 'reload config';
