-- Function to get system prompt (Security Definer to bypass RLS)
create or replace function get_simulation_prompt(p_simulation_id uuid)
returns text
language plpgsql
security definer
as $$
declare
  v_prompt text;
begin
  select system_prompt into v_prompt
  from simulations
  where id = p_simulation_id;
  
  return v_prompt;
end;
$$;

-- Function to submit flag
create or replace function submit_flag(
  p_simulation_id uuid,
  p_team_id uuid,
  p_user_id uuid,
  p_flag_input text
)
returns json
language plpgsql
security definer
as $$
declare
  v_correct_flag text;
  v_is_correct boolean;
  v_points integer := 100; -- Default points, could be dynamic
  v_already_solved boolean;
begin
  -- Get correct flag
  select flag_code into v_correct_flag
  from simulations
  where id = p_simulation_id;
  
  -- Check if correct
  v_is_correct := (trim(p_flag_input) = v_correct_flag);
  
  -- Check if team already solved this
  select exists(
    select 1 from submissions 
    where team_id = p_team_id 
    and simulation_id = p_simulation_id 
    and is_correct = true
  ) into v_already_solved;
  
  -- Record submission
  insert into submissions (team_id, simulation_id, user_id, code_submitted, is_correct)
  values (p_team_id, p_simulation_id, p_user_id, p_flag_input, v_is_correct);
  
  -- Update score if correct and not already solved
  if v_is_correct and not v_already_solved then
    update teams
    set score = score + v_points
    where id = p_team_id;
  end if;
  
  return json_build_object(
    'success', v_is_correct,
    'already_solved', v_already_solved,
    'points_awarded', (case when v_is_correct and not v_already_solved then v_points else 0 end)
  );
end;
$$;
