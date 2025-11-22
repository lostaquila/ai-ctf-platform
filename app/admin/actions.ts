'use server';

import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

// Helper to get Admin Client
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

// Helper to check authentication and authorization
async function requireAdmin() {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('Unauthorized: Not logged in');
    }

    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
    if (!user.email || !adminEmails.includes(user.email)) {
        throw new Error('Unauthorized: Access denied');
    }
    return user;
}

export async function getAdminData() {
    try {
        await requireAdmin();
        const supabaseAdmin = getAdminClient();

        // Fetch all auth users
        const { data: { users: authUsers }, error: authError } = await supabaseAdmin.auth.admin.listUsers();
        if (authError) throw authError;

        // Fetch all profiles with team info
        const { data: profiles, error: dbError } = await supabaseAdmin
            .from('profiles')
            .select('*, teams(name, score, join_code)');
        if (dbError) throw dbError;

        // Merge Data
        const mergedUsers = authUsers.map((authUser) => {
            const profile = profiles?.find((p) => p.id === authUser.id);
            // @ts-ignore
            const team = profile?.teams;

            return {
                id: authUser.id,
                email: authUser.email,
                username: profile?.username || 'Unknown',
                teamName: team?.name || 'No Team',
                teamScore: team?.score || 0,
                lastSignIn: authUser.last_sign_in_at ? new Date(authUser.last_sign_in_at).toLocaleString() : 'Never'
            };
        });

        // Fetch all simulations
        const { data: simulations, error: simError } = await supabaseAdmin
            .from('simulations')
            .select('*')
            .order('created_at', { ascending: false });
        if (simError) throw simError;

        // Try to fetch hints (may fail if table not in cache)
        let simulationsWithHints = simulations;
        try {
            const { data: hints, error: hintsError } = await supabaseAdmin
                .from('simulation_hints')
                .select('*');

            if (hintsError) {
                console.error('Error fetching hints (table may not be in cache):', hintsError);
                // Return simulations without hints
            } else if (hints) {
                // Merge hints into simulations for UI compatibility
                simulationsWithHints = simulations.map(sim => {
                    const simHints = hints.filter(h => h.simulation_id === sim.id) || [];
                    return {
                        ...sim,
                        hint_1: simHints.find(h => h.hint_index === 1)?.content || '',
                        hint_2: simHints.find(h => h.hint_index === 2)?.content || '',
                        hint_3: simHints.find(h => h.hint_index === 3)?.content || ''
                    };
                });
            }
        } catch (hintFetchError) {
            console.error('Failed to fetch hints:', hintFetchError);
            // Continue without hints
        }

        return { success: true, users: mergedUsers, simulations: simulationsWithHints };
    } catch (error: any) {
        console.error('getAdminData Error:', error);
        return { error: error.message };
    }
}

export async function createSimulation(data: {
    title: string;
    description: string;
    system_prompt: string;
    flag_code: string;
    type: 'practice' | 'live';
    points: number;
    hint_1?: string;
    hint_2?: string;
    hint_3?: string;
}) {
    try {
        await requireAdmin();
        const supabaseAdmin = getAdminClient();

        // 1. Insert Simulation (Standard Fields Only)
        const insertData = {
            title: data.title,
            description: data.description,
            system_prompt: data.system_prompt,
            flag_code: data.flag_code,
            type: data.type,
            points: data.points
        };

        const { data: newSim, error } = await supabaseAdmin
            .from('simulations')
            .insert(insertData)
            .select()
            .single();

        if (error) throw error;

        // 2. Insert Hints (if any) - gracefully handle if table not in cache
        const hintsToInsert = [];
        if (data.hint_1) hintsToInsert.push({ simulation_id: newSim.id, hint_index: 1, content: data.hint_1, cost: 10 });
        if (data.hint_2) hintsToInsert.push({ simulation_id: newSim.id, hint_index: 2, content: data.hint_2, cost: 25 });
        if (data.hint_3) hintsToInsert.push({ simulation_id: newSim.id, hint_index: 3, content: data.hint_3, cost: 50 });

        if (hintsToInsert.length > 0) {
            try {
                const { error: hintError } = await supabaseAdmin
                    .from('simulation_hints')
                    .insert(hintsToInsert);

                if (hintError) {
                    console.error('Error inserting hints (table may not be in cache):', hintError);
                    // Continue - simulation was created successfully
                }
            } catch (hintInsertError) {
                console.error('Failed to insert hints:', hintInsertError);
                // Continue - simulation was created successfully
            }
        }

        revalidatePath('/admin');
        revalidatePath('/practice');
        revalidatePath('/live');
        return { success: true };
    } catch (error: any) {
        return { error: error.message };
    }
}

export async function resetGame() {
    try {
        await requireAdmin();
        const supabaseAdmin = getAdminClient();

        // 1. Delete all submissions
        // Using a condition that is always true to bypass "delete without where" safety if needed, 
        // but Supabase JS usually requires a filter.
        const { error: subError } = await supabaseAdmin
            .from('submissions')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000');

        if (subError) throw subError;

        // 2. Reset all team scores to 0
        const { error: teamError } = await supabaseAdmin
            .from('teams')
            .update({ score: 0 })
            .neq('id', '00000000-0000-0000-0000-000000000000');

        if (teamError) throw teamError;

        // 3. Reset unlocked hints
        const { error: hintError } = await supabaseAdmin
            .from('unlocked_hints')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000');

        if (hintError) throw hintError;

        revalidatePath('/');
        return { success: true };
    } catch (error: any) {
        return { error: error.message };
    }
}

export async function deleteSimulation(id: string) {
    try {
        await requireAdmin();
        const supabaseAdmin = getAdminClient();

        const { error } = await supabaseAdmin
            .from('simulations')
            .delete()
            .eq('id', id);

        if (error) throw error;

        revalidatePath('/admin');
        revalidatePath('/practice');
        revalidatePath('/live');
        return { success: true };
    } catch (error: any) {
        return { error: error.message };
    }
}

export async function updateSimulation(id: string, data: {
    title: string;
    description: string;
    system_prompt: string;
    flag_code: string;
    type: 'practice' | 'live';
    points: number;
    hint_1?: string;
    hint_2?: string;
    hint_3?: string;
}) {
    try {
        await requireAdmin();
        const supabaseAdmin = getAdminClient();

        // 1. Update Simulation (Standard Fields Only)
        const updateData = {
            title: data.title,
            description: data.description,
            system_prompt: data.system_prompt,
            flag_code: data.flag_code,
            type: data.type,
            points: data.points
        };

        const { error } = await supabaseAdmin
            .from('simulations')
            .update(updateData)
            .eq('id', id);

        if (error) throw error;

        // 2. Update Hints (Delete old, insert new) - gracefully handle if table not in cache
        try {
            // First, delete existing hints for this simulation
            await supabaseAdmin.from('simulation_hints').delete().eq('simulation_id', id);

            // Then insert new ones
            const hintsToInsert = [];
            if (data.hint_1) hintsToInsert.push({ simulation_id: id, hint_index: 1, content: data.hint_1, cost: 10 });
            if (data.hint_2) hintsToInsert.push({ simulation_id: id, hint_index: 2, content: data.hint_2, cost: 25 });
            if (data.hint_3) hintsToInsert.push({ simulation_id: id, hint_index: 3, content: data.hint_3, cost: 50 });

            if (hintsToInsert.length > 0) {
                const { error: hintError } = await supabaseAdmin
                    .from('simulation_hints')
                    .insert(hintsToInsert);

                if (hintError) {
                    console.error('Error updating hints (table may not be in cache):', hintError);
                }
            }
        } catch (hintUpdateError) {
            console.error('Failed to update hints:', hintUpdateError);
            // Continue - simulation was updated successfully
        }

        revalidatePath('/admin');
        revalidatePath('/practice');
        revalidatePath('/live');
        return { success: true };
    } catch (error: any) {
        return { error: error.message };
    }
}
