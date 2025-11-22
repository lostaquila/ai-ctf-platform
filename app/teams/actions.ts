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

    const { error } = await supabase
        .from('profiles')
        .update({ team_id: null })
        .eq('id', user.id);

    if (error) return { error: error.message };

    revalidatePath('/', 'layout');
    return { success: true };
}
