import { createClient } from '@/utils/supabase/server';
import LiveSimulationView from '@/components/LiveSimulationView';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function LiveChallengePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    // Get user's team from profiles
    const { data: profile } = await supabase
        .from('profiles')
        .select('team_id')
        .eq('id', user.id)
        .maybeSingle();

    if (!profile?.team_id) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-12 text-center">
                <h1 className="text-2xl font-bold text-white mb-4">Team Required</h1>
                <p className="text-gray-400 mb-6">You must join or create a team to participate.</p>
                <a href="/teams" className="text-primary hover:underline">Go to Teams</a>
            </div>
        );
    }

    const { data: simulation } = await supabase
        .from('simulations')
        .select('id, title, description, type, flag_code')
        .eq('id', id)
        .maybeSingle();

    if (!simulation) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-12 text-center">
                <div className="p-8 text-red-500 bg-red-500/10 rounded-xl inline-block">
                    <h2 className="text-xl font-bold">Simulation not found</h2>
                    <p className="text-sm mt-2">The simulation ID {id} does not exist.</p>
                </div>
            </div>
        );
    }

    // Fetch unlocked hints
    const { data: unlockedHints } = await supabase
        .from('unlocked_hints')
        .select('hint_index')
        .eq('team_id', profile.team_id)
        .eq('simulation_id', id);

    const initialMessages = [
        { role: 'assistant' as const, content: 'Who goes there? State your business!' }
    ];

    return (
        <LiveSimulationView
            simulation={simulation}
            initialMessages={initialMessages}
            initialUnlockedHints={unlockedHints?.map(h => h.hint_index) || []}
            teamId={profile.team_id}
        />
    );
}
