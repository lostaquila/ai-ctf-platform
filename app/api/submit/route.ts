import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const { simulationId, teamId, flag } = await request.json();

        // Submit flag via RPC
        const { data: result, error: submitError } = await supabase
            .rpc('submit_flag', {
                p_simulation_id: simulationId,
                p_team_id: teamId,
                p_user_id: user.id,
                p_flag_input: flag,
            });

        if (submitError) {
            console.error('Error submitting flag:', submitError);
            return new NextResponse('Failed to submit flag', { status: 500 });
        }

        return NextResponse.json(result);

    } catch (error) {
        console.error('Submission API Error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
