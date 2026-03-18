'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function joinEvent(accessCode: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'Not authenticated' };

    // 1. Get user's team
    const { data: profile } = await supabase
        .from('profiles')
        .select('team_id')
        .eq('id', user.id)
        .single();

    if (!profile?.team_id) return { error: 'You must be in a team to join an event.' };

    // 2. Find the event
    const { data: event, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('access_code', accessCode)
        .single();

    if (eventError || !event) return { error: 'Invalid access code.' };

    if (!event.is_active) return { error: 'This event has not started yet.' };

    // 3. Add team to event participants
    const { error: joinError } = await supabase
        .from('event_participants')
        .insert({
            team_id: profile.team_id,
            event_id: event.id
        });

    if (joinError) {
        if (joinError.code === '23505') { // Unique violation
            return { success: true, message: 'Already joined!' }; // Treat as success
        }
        return { error: joinError.message };
    }

    revalidatePath('/live');
    return { success: true };
}

export async function getEventData() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'Not authenticated' };

    // 1. Get user's team
    const { data: profile } = await supabase
        .from('profiles')
        .select('team_id')
        .eq('id', user.id)
        .single();

    if (!profile?.team_id) return { notInTeam: true };

    // 2. Check if team is in an active event
    // We join event_participants with events to get event details
    const { data: participation, error } = await supabase
        .from('event_participants')
        .select('event_id, events(*)')
        .eq('team_id', profile.team_id)
        .single();

    if (error || !participation) return { noEvent: true };

    const event = participation.events;

    // 3. Fetch simulations for this event
    // @ts-ignore
    const eventId = event.id;

    const { data: simulations } = await supabase
        .from('simulations')
        .select('*')
        .eq('event_id', eventId)
        .order('points', { ascending: true });



    // 4. Fetch team's progress (solved simulations for THIS event only)
    const simulationIds = simulations?.map(s => s.id) || [];

    const { data: submissions } = await supabase
        .from('submissions')
        .select('simulation_id')
        .eq('team_id', profile.team_id)
        .eq('is_correct', true)
        .in('simulation_id', simulationIds.length > 0 ? simulationIds : ['00000000-0000-0000-0000-000000000000']); // Prevent empty array error

    // Deduplicate solved IDs to handle multiple submissions for the same simulation
    const solvedIds = Array.from(new Set(submissions?.map(s => s.simulation_id) || []));

    return {
        success: true,
        // @ts-ignore
        event: event,
        simulations: simulations || [],
        solvedIds
    };
}
