-- RPC Function to handle hint unlocking entirely in the database
-- This bypasses the API schema cache completely

CREATE OR REPLACE FUNCTION public.unlock_hint_rpc(
    p_team_id uuid,
    p_simulation_id uuid,
    p_hint_index integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_cost integer;
    v_team_score integer;
    v_hint_content text;
    v_already_unlocked boolean;
BEGIN
    -- Validate hint index
    IF p_hint_index NOT IN (1, 2, 3) THEN
        RETURN jsonb_build_object('error', 'Invalid hint index');
    END IF;

    -- Determine cost
    v_cost := CASE p_hint_index
        WHEN 1 THEN 10
        WHEN 2 THEN 25
        WHEN 3 THEN 50
    END;

    -- Check if already unlocked
    SELECT EXISTS(
        SELECT 1 FROM public.unlocked_hints
        WHERE team_id = p_team_id
        AND simulation_id = p_simulation_id
        AND hint_index = p_hint_index
    ) INTO v_already_unlocked;

    -- Get hint content
    SELECT content INTO v_hint_content
    FROM public.simulation_hints
    WHERE simulation_id = p_simulation_id
    AND hint_index = p_hint_index;

    IF v_hint_content IS NULL THEN
        RETURN jsonb_build_object('error', 'Hint not found');
    END IF;

    -- If already unlocked, return immediately
    IF v_already_unlocked THEN
        RETURN jsonb_build_object(
            'success', true,
            'hint', v_hint_content,
            'alreadyUnlocked', true
        );
    END IF;

    -- Check team balance
    SELECT score INTO v_team_score
    FROM public.teams
    WHERE id = p_team_id;

    IF v_team_score IS NULL THEN
        RETURN jsonb_build_object('error', 'Team not found');
    END IF;

    IF v_team_score < v_cost THEN
        RETURN jsonb_build_object(
            'error', 
            format('Insufficient points. You need %s points to unlock this hint.', v_cost)
        );
    END IF;

    -- Deduct points
    UPDATE public.teams
    SET score = score - v_cost
    WHERE id = p_team_id;

    -- Record unlock
    INSERT INTO public.unlocked_hints (team_id, simulation_id, hint_index)
    VALUES (p_team_id, p_simulation_id, p_hint_index);

    -- Return success with hint
    RETURN jsonb_build_object(
        'success', true,
        'hint', v_hint_content,
        'costDeducted', v_cost
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('error', SQLERRM);
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.unlock_hint_rpc(uuid, uuid, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.unlock_hint_rpc(uuid, uuid, integer) TO authenticated;

-- Force reload
NOTIFY pgrst, 'reload config';
