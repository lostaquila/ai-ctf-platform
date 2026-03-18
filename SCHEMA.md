# Database Schema (Source of Truth)

## Tables

### `teams`
- `id` (uuid, PK)
- `name` (text, unique)
- `join_code` (text, unique)
- `score` (int, default 0)
- `created_at` (timestamp)

### `profiles`
- `id` (uuid, PK, references auth.users)
- `username` (text)
- `team_id` (uuid, FK to teams.id)
- `created_at` (timestamp)

### `simulations`
- `id` (uuid, PK)
- `title` (text)
- `description` (text)
- `system_prompt` (text) - **Private** (Server-side only)
- `flag_code` (text) - **Private** (Server-side only)
- `type` (text: 'practice' | 'live')
- `start_time` (timestamp) - Controls when Live rounds are visible.

### `submissions`
- `id` (uuid, PK)
- `team_id` (uuid, FK to teams.id)
- `simulation_id` (uuid, FK to simulations.id)
- `user_id` (uuid, FK to profiles.id)
- `is_correct` (boolean)

## Critical Logic & Triggers

1.  **Auto-Join Team:**
    - Trigger: `on_team_created`
    - Logic: When a row is inserted into `teams`, the creator's `profiles.team_id` is AUTOMATICALLY updated to the new team ID.
    - **Implication:** The application code for "Create Team" MUST NOT try to update the profile manually.

2.  **RLS Policies:**
    - Profiles & Teams are publicly readable.
    - Simulations are readable based on `start_time` (Live rounds hidden until start).
