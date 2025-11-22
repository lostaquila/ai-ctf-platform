'use server';

import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

// Helper to get Admin Client (Service Role)
function getAdminClient() {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
    }
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    );
}

// Helper to check authentication and get team_id
async function getAuthenticatedUserTeam() {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Unauthorized');

    // Get user's team
    const { data: profile, error } = await supabase
        .from('profiles')
        .select('team_id')
        .eq('id', user.id)
        .single();

    if (error || !profile?.team_id) {
        throw new Error('You must be in a team to unlock hints.');
    }

    return { user, teamId: profile.team_id };
}

export async function unlockHint(simulationId: string, hintIndex: number) {
    try {
        const { teamId } = await getAuthenticatedUserTeam();
        const supabaseAdmin = getAdminClient();

        // Validate hint index
        if (![1, 2, 3].includes(hintIndex)) {
            throw new Error('Invalid hint index');
        }

        // Call RPC function that handles everything in the database
        const { data, error } = await supabaseAdmin.rpc('unlock_hint_rpc', {
            p_team_id: teamId,
            p_simulation_id: simulationId,
            p_hint_index: hintIndex
        });

        if (error) {
            console.error('RPC Error:', error);
            throw new Error(error.message || 'Failed to unlock hint');
        }

        // The RPC returns a JSON object with either success or error
        if (data.error) {
            return { error: data.error };
        }

        revalidatePath(`/practice/${simulationId}`);
        revalidatePath(`/live/${simulationId}`);

        return {
            success: data.success,
            hint: data.hint,
            costDeducted: data.costDeducted,
            alreadyUnlocked: data.alreadyUnlocked
        };

    } catch (error: any) {
        console.error('unlockHint Error:', error);
        return { error: error.message || 'Failed to unlock hint' };
    }
}
