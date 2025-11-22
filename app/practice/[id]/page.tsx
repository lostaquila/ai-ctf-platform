import { createClient } from '@/utils/supabase/server';
import ChatInterface from '@/components/ChatInterface';
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
        .select('title, description')
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
                />
            </Suspense>
        </div>
    );
}
