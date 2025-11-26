-- Create Events Table
create table if not exists events (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  access_code text unique not null,
  is_active boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add event_id to simulations
alter table simulations 
add column if not exists event_id uuid references events(id) on delete set null;

-- Create Event Participants Table
create table if not exists event_participants (
  id uuid default gen_random_uuid() primary key,
  team_id uuid references teams(id) on delete cascade not null,
  event_id uuid references events(id) on delete cascade not null,
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(team_id, event_id)
);

-- RLS Policies

-- Events: Public read (for code validation), Service role has full access
alter table events enable row level security;

create policy "Everyone can read events"
  on events for select
  using (true);

create policy "Service role can insert events"
  on events for insert
  with check (true);

create policy "Service role can update events"
  on events for update
  using (true);

create policy "Service role can delete events"
  on events for delete
  using (true);

-- Note: Admin operations in app/admin/actions.ts use the service role key,
-- which will use these permissive policies.

-- Event Participants: 
-- Teams can insert themselves (join)
-- Teams can read their own participations
alter table event_participants enable row level security;

create policy "Teams can join events"
  on event_participants for insert
  with check (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() 
      and profiles.team_id = event_participants.team_id
    )
  );

create policy "Teams can view their joined events"
  on event_participants for select
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() 
      and profiles.team_id = event_participants.team_id
    )
  );
