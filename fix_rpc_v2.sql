-- V2 Function with new name and TEXT id to bypass cache/type issues
CREATE OR REPLACE FUNCTION public.admin_update_sim_v2(
    p_id text, -- Changed to TEXT to avoid UUID casting issues at API boundary
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
    WHERE id = p_id::uuid; -- Cast back to UUID here

    RETURN FOUND;
END;
$$;

-- Grant Permissions
GRANT EXECUTE ON FUNCTION public.admin_update_sim_v2 TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_update_sim_v2 TO authenticated;

-- Force Reload
NOTIFY pgrst, 'reload config';
