import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import { Play, Lock, Calendar } from 'lucide-react';

// Set this to your competition start date
const START_DATE = new Date('2024-01-01T00:00:00Z');

export default async function LivePage() {
  const now = new Date();
  const isLive = now >= START_DATE;

  if (!isLive) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-4 text-center">
        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 animate-pulse">
          <Lock className="w-10 h-10 text-gray-400" />
        </div>
        <h1 className="text-4xl font-bold text-white mb-4">Coming Soon</h1>
        <p className="text-xl text-gray-400 max-w-md mb-8">
          The live competition has not started yet. Practice your skills in the training arena while you wait.
        </p>
        <div className="flex items-center text-primary bg-primary/10 px-4 py-2 rounded-lg">
          <Calendar className="w-5 h-5 mr-2" />
          Starts on <span suppressHydrationWarning>{START_DATE.toLocaleDateString()}</span>
        </div>
      </div>
    );
  }

  const supabase = await createClient();

  const { data: simulations } = await supabase
    .from('simulations')
    .select('id, title, description')
    .eq('type', 'live')
    .order('created_at', { ascending: true });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center mb-8">
        <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center mr-4">
          <Play className="w-6 h-6 text-red-500" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Live Competition</h1>
          <p className="text-gray-400">The clock is ticking. Good luck.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {simulations?.map((sim) => (
          <Link
            key={sim.id}
            href={`/live/${sim.id}`}
            className="glass-card p-6 hover:border-red-500/50 transition-all group cursor-pointer"
          >
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-red-500 transition-colors">
              {sim.title}
            </h3>
            <p className="text-gray-400 mb-4 line-clamp-2">
              {sim.description || 'No description available.'}
            </p>
            <div className="flex items-center text-sm text-red-500 font-medium">
              Enter Simulation
              <Play className="w-4 h-4 ml-2 fill-current" />
            </div>
          </Link>
        ))}

        {(!simulations || simulations.length === 0) && (
          <div className="col-span-full text-center py-12 text-gray-500">
            No live challenges available at the moment.
          </div>
        )}
      </div>
    </div>
  );
}
