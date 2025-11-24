'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createTeamAction(teamName: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'Not authenticated' };

    const code = Math.random().toString(36).substring(2, 8).toUpperCase();

    // 1. Create Team
    // The 'on_team_created' trigger will automatically add the creator to the team
    const { data: newTeam, error: createError } = await supabase
        .from('teams')
        .insert({
            name: teamName,
            join_code: code,
        })
        .select()
        .single();

    if (createError) {
        if (createError.code === '23505') { // Unique violation
            return { error: 'Team name already taken' };
        }
        return { error: createError.message };
    }

    revalidatePath('/', 'layout');
    return { success: true, team: newTeam };
}

export async function joinTeamAction(joinCode: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'Not authenticated' };

    // 1. Find team by code
    const { data: teamData, error: findError } = await supabase
        .from('teams')
        .select('*')
        .eq('join_code', joinCode.toUpperCase())
        .single();

    if (findError || !teamData) return { error: 'Invalid join code' };

    // 2. Update user profile to join team
    const { error: updateError } = await supabase
        .from('profiles')
        .update({ team_id: teamData.id })
        .eq('id', user.id);

    if (updateError) {
        if (updateError.message.includes('Team is full')) {
            return { error: 'This team is full (max 4 members).' };
        }
        return { error: updateError.message };
    }

    revalidatePath('/', 'layout');
    return { success: true, team: teamData };
}

export async function leaveTeamAction() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'Not authenticated' };

    // 1. Get user's current team_id
    const { data: profile } = await supabase
        .from('profiles')
        .select('team_id')
        .eq('id', user.id)
        .single();

    if (!profile?.team_id) return { error: 'Not in a team' };

    const teamId = profile.team_id;

    // 2. Check how many members are in this team
    const { count, error: countError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('team_id', teamId);

    if (countError) return { error: 'Failed to check team membership' };

    // 3. If user is the last member, delete the team
    if (count === 1) {
        const { error: deleteError } = await supabase
            .from('teams')
            .delete()
            .eq('id', teamId);

        if (deleteError) return { error: 'Failed to delete team' };
    } else {
        // 4. Otherwise, just remove the user from the team
        const { error: leaveError } = await supabase
            .from('profiles')
            .update({ team_id: null })
            .eq('id', user.id);

        if (leaveError) return { error: leaveError.message };
    }

    revalidatePath('/', 'layout');
    return { success: true };
}
