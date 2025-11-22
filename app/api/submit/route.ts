import { createClient as createServerClient } from '@/utils/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const { simulationId, teamId, flag } = await request.json();

        // Fetch the correct flag using Admin client (to bypass RLS)
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        );

        const { data: simulation } = await supabaseAdmin
            .from('simulations')
            .select('flag_code')
            .eq('id', simulationId)
            .single();

        if (!simulation) {
            return new NextResponse('Simulation not found', { status: 404 });
        }

        const correctFlag = simulation.flag_code;
        const isMatch = flag.trim().toLowerCase() === correctFlag.trim().toLowerCase();

        // If it's a match, we send the EXACT correct flag to the RPC to ensure it passes the strict SQL check
        // If not, we send the user's input so it fails as expected
        const flagToSubmit = isMatch ? correctFlag : flag;

        // Submit flag via RPC
        const { data: result, error: submitError } = await supabase
            .rpc('submit_flag', {
                p_simulation_id: simulationId,
                p_team_id: teamId,
                p_user_id: user.id,
                p_flag_input: flagToSubmit,
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
