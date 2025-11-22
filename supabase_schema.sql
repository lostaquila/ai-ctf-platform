-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Teams Table
create table teams (
  id uuid default uuid_generate_v4() primary key,
  name text unique not null,
  join_code text unique not null,
  score integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Profiles Table
create table profiles (
  id uuid references auth.users on delete cascade not null primary key,
  username text unique,
  team_id uuid references teams(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Simulations Table
create table simulations (
  id uuid default uuid_generate_v4() primary key,
  type text check (type in ('practice', 'live')) not null,
  title text not null,
  description text,
  system_prompt text not null, 
  flag_code text not null, 
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Submissions Table
create table submissions (
  id uuid default uuid_generate_v4() primary key,
  team_id uuid references teams(id) on delete cascade not null,
  simulation_id uuid references simulations(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  code_submitted text not null,
  is_correct boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies

-- Profiles
alter table profiles enable row level security;
create policy "Public profiles are viewable by everyone." on profiles for select using (true);
create policy "Users can insert their own profile." on profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile." on profiles for update using (auth.uid() = id);
-- Allow users to see profiles of people in their OWN team
create policy "See team members"
on profiles for select
using (
  team_id is not null 
  and 
  team_id = (select team_id from profiles where id = auth.uid())
);

-- Teams
alter table teams enable row level security;
create policy "Teams are viewable by everyone." on teams for select using (true);
create policy "Authenticated users can create teams." on teams for insert with check (auth.role() = 'authenticated');
create policy "Team members can update their team." on teams for update using (
  exists (select 1 from profiles where profiles.team_id = teams.id and profiles.id = auth.uid())
);

-- Simulations
alter table simulations enable row level security;
create policy "Public can view simulation details." on simulations for select using (true);
revoke select on simulations from anon, authenticated;
grant select (id, type, title, description, created_at) on simulations to anon, authenticated;

-- Submissions
alter table submissions enable row level security;
create policy "Submissions are viewable by everyone." on submissions for select using (true);
create policy "Users can create submissions." on submissions for insert with check (auth.uid() = user_id);

-- Trigger for Max 4 members
create or replace function check_team_size()
returns trigger as $$
begin
  if NEW.team_id is not null then
    if (select count(*) from profiles where team_id = NEW.team_id) >= 4 then
      raise exception 'Team is full (max 4 members)';
    end if;
  end if;
  return NEW;
end;
$$ language plpgsql;

create trigger check_team_size_trigger
before update of team_id on profiles
for each row execute function check_team_size();

-- Trigger to create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username)
  values (new.id, new.raw_user_meta_data->>'username');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Trigger to automatically add creator to team
create or replace function public.auto_join_team()
returns trigger as $$
begin
  update public.profiles
  set team_id = new.id
  where id = auth.uid();
  return new;
end;
$$ language plpgsql security definer;

create trigger on_team_created
after insert on public.teams
for each row execute procedure public.auto_join_team();
