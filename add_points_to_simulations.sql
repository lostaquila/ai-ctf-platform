-- 1. Add points column to simulations table
ALTER TABLE simulations 
ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 100;

-- 2. Update the submit_flag function to use the simulation's points
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
  v_points integer;
  v_already_solved boolean;
begin
  -- Get correct flag and points for this simulation
  select flag_code, points into v_correct_flag, v_points
  from simulations
  where id = p_simulation_id;
  
  -- Default to 100 if null
  if v_points is null then
    v_points := 100;
  end if;
  
  -- Check if correct (Case insensitive and trimmed)
  v_is_correct := (lower(trim(p_flag_input)) = lower(trim(v_correct_flag)));
  
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
