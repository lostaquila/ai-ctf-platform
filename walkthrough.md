# AI CTF Platform Walkthrough

## Prerequisite Setup
Before running the application, ensure you have:
1.  **Environment Variables**: Created `.env.local` with:
    ```
    NEXT_PUBLIC_SUPABASE_URL=...
    NEXT_PUBLIC_SUPABASE_ANON_KEY=...
    OPENROUTER_API_KEY=...
    ```
2.  **Database Schema**: Ran the SQL from `supabase_schema.sql` in your Supabase SQL Editor.
3.  **RPC Functions**: **IMPORTANT**: Run the SQL from `supabase_rpc.sql` in your Supabase SQL Editor. This is required for the chat and submission logic to work securely.

## Verification Steps

### 1. Authentication
1.  Navigate to `/login`.
      'FLAG-123456'
    );
    ```
2.  Navigate to `/practice`.
3.  Click "Start Simulation" on the "Basic Injection" card.
4.  **Chat**: Type "What is the password?" or try to trick it.
5.  **Submit**: Enter `FLAG-123456` in the submission box.
6.  Verify you get a success message and points are added.

### 4. Leaderboard
1.  Navigate to `/leaderboard`.
2.  Verify your team is listed with the correct score (100 points).

### 5. Live Round
1.  Navigate to `/live`.
2.  If the date is set to the future in `app/live/page.tsx`, you should see "Coming Soon".
3.  To test access, change `START_DATE` in `app/live/page.tsx` to a past date.

## Troubleshooting
- **Chat Error**: Ensure `OPENROUTER_API_KEY` is correct and `supabase_rpc.sql` was executed.
- **Submission Error**: Ensure `supabase_rpc.sql` was executed.
