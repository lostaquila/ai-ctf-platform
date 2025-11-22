import { createClient } from '@/utils/supabase/server';
import ChatInterface from '@/components/ChatInterface';
import LiveSimulationView from '@/components/LiveSimulationView';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ChallengePage({ params }: { params: Promise<{ id: string }> }) {
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

    // Debug logging
    console.log('Simulation type:', simulation.type);
    console.log('Is live?', simulation.type === 'live');

    // Conditional rendering based on simulation type
    if (simulation.type === 'live') {
        return (
            <LiveSimulationView
                simulation={simulation}
                initialMessages={initialMessages}
                initialUnlockedHints={unlockedHints?.map(h => h.hint_index) || []}
            />
        );
    }

    // Default: Practice mode
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-white">{simulation.title}</h1>
                <p className="text-gray-400">{simulation.description}</p>
            </div>

            <Suspense fallback={
                <div className="flex items-center justify-center h-96 glass-card">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            }>
                <ChatInterface
                    simulationId={id}
                    teamId={profile.team_id}
                    initialUnlockedHints={unlockedHints?.map(h => h.hint_index) || []}
                />
            </Suspense>
        </div>
    );
}
