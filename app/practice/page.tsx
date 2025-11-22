import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import { Terminal, ArrowRight, Lock, Users } from 'lucide-react';
import { getUserProfile } from '@/utils/supabase/queries';

export const dynamic = 'force-dynamic';

export default async function PracticePage() {
  const supabase = await createClient();
  const profile = await getUserProfile();
  const hasTeam = !!profile?.team_id;

  const { data: simulations } = await supabase
    .from('simulations')
    .select('id, title, description')
    .eq('type', 'practice')
    .order('created_at', { ascending: true });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center mb-8">
        <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mr-4">
          <Terminal className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Practice Arena</h1>
          <p className="text-gray-400">Hone your skills against these training simulations.</p>
        </div>
      </div>

      {!hasTeam && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-6 mb-8 flex items-center justify-between">
          <div className="flex items-center">
            <Users className="w-6 h-6 text-yellow-500 mr-4" />
            <div>
              <h3 className="text-lg font-semibold text-yellow-500">Team Required</h3>
              <p className="text-gray-400">You must join or create a team to participate in simulations.</p>
            </div>
          </div>
          <Link
            href="/teams"
            className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 px-4 rounded-lg transition-colors"
          >
            Go to Teams
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {simulations?.map((sim) => (
          <div
            key={sim.id}
            className={`glass-card p-6 transition-all group ${hasTeam ? 'hover:border-primary/50 cursor-pointer' : 'opacity-75'}`}
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-xl font-bold text-white group-hover:text-primary transition-colors">
                {sim.title}
              </h3>
              {!hasTeam && <Lock className="w-4 h-4 text-gray-500" />}
            </div>
            <p className="text-gray-400 mb-4 line-clamp-2">
              {sim.description || 'No description available.'}
            </p>

            {hasTeam ? (
              <Link href={`/practice/${sim.id}`} className="flex items-center text-sm text-primary font-medium">
                Start Simulation
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            ) : (
              <div className="flex items-center text-sm text-gray-500 font-medium cursor-not-allowed">
                Join a team to play
              </div>
            )}
          </div>
        ))}

        {(!simulations || simulations.length === 0) && (
          <div className="col-span-full text-center py-12 text-gray-500">
            No practice simulations available yet.
          </div>
        )}
      </div>
    </div>
  );
}
