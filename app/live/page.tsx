'use client';

import { useState, useEffect } from 'react';
import { Loader2, Lock, Play, CheckCircle, Trophy, AlertCircle } from 'lucide-react';
import { joinEvent, getEventData } from './actions';
import Link from 'next/link';

export default function LiveLobbyPage() {
  const [loading, setLoading] = useState(true);
  const [viewState, setViewState] = useState<'loading' | 'not_in_team' | 'enter_code' | 'lobby'>('loading');
  const [eventData, setEventData] = useState<any>(null);
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadLobby();
  }, []);

  const loadLobby = async () => {
    setLoading(true);
    const result = await getEventData();

    if (result.notInTeam) {
      setViewState('not_in_team');
    } else if (result.noEvent) {
      setViewState('enter_code');
    } else if (result.success) {
      setEventData(result);
      setViewState('lobby');
    } else {
      setError('Failed to load lobby.');
    }
    setLoading(false);
  };

  const handleJoinEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setError(null);

    const result = await joinEvent(accessCode);

    if (result.error) {
      setError(result.error);
    } else {
      loadLobby();
    }
    setActionLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <Loader2 className="w-12 h-12 animate-spin text-red-500" />
      </div>
    );
  }

  if (viewState === 'not_in_team') {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
          <UsersIcon className="w-16 h-16 text-slate-500 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-white mb-4">Team Required</h1>
          <p className="text-slate-400 mb-8">
            You must be part of a team to participate in live events.
          </p>
          <Link
            href="/teams"
            className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors"
          >
            Create or Join a Team
          </Link>
        </div>
      </div>
    );
  }

  if (viewState === 'enter_code') {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-900/20 via-black to-black pointer-events-none" />

        <div className="max-w-md w-full bg-slate-900/80 backdrop-blur-xl border border-red-500/30 rounded-2xl p-8 relative z-10 shadow-[0_0_50px_rgba(220,38,38,0.2)]">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/50">
            <Lock className="w-8 h-8 text-red-500" />
          </div>

          <h1 className="text-3xl font-bold text-white text-center mb-2">Live Event Access</h1>
          <p className="text-slate-400 text-center mb-8">Enter the tournament access code to join.</p>

          <form onSubmit={handleJoinEvent} className="space-y-4">
            <div>
              <input
                type="text"
                required
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                className="w-full bg-black/50 border border-red-500/30 rounded-xl px-4 py-4 text-center text-2xl font-mono text-white placeholder:text-slate-700 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 uppercase tracking-widest"
                placeholder="CODE"
              />
            </div>

            {error && (
              <div className="flex items-center justify-center gap-2 text-red-400 text-sm bg-red-950/50 p-3 rounded-lg border border-red-900">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={actionLoading || !accessCode}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-900/20 flex items-center justify-center gap-2"
            >
              {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'ENTER TOURNAMENT'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // LOBBY VIEW
  return (
    <div className="min-h-screen bg-slate-950 text-white relative overflow-hidden">
      {/* Header */}
      <div className="relative z-10 bg-slate-900/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/20 animate-pulse">
                ● LIVE EVENT
              </span>
              <h1 className="text-2xl font-bold">{eventData.event.title}</h1>
            </div>
            <p className="text-slate-400 text-sm">Complete all challenges to win.</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-yellow-400 font-mono">
              {eventData.solvedIds.length} / {eventData.simulations.length}
            </div>
            <div className="text-xs text-slate-500 uppercase tracking-wider">Challenges Solved</div>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {eventData.simulations.map((sim: any) => {
            const isSolved = eventData.solvedIds.includes(sim.id);
            return (
              <Link
                key={sim.id}
                href={`/live/${sim.id}`}
                className={`group relative bg-slate-900 border rounded-2xl overflow-hidden transition-all hover:-translate-y-1 hover:shadow-2xl ${isSolved
                    ? 'border-green-500/30 hover:border-green-500/50'
                    : 'border-white/10 hover:border-red-500/50'
                  }`}
              >
                {/* Status Banner */}
                {isSolved && (
                  <div className="absolute top-4 right-4 z-20 bg-green-500 text-black text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> SOLVED
                  </div>
                )}

                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isSolved ? 'bg-green-500/20 text-green-400' : 'bg-slate-800 text-slate-400 group-hover:bg-red-500/20 group-hover:text-red-400'
                      }`}>
                      {isSolved ? <Trophy className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                    </div>
                    <span className="font-mono text-yellow-400 font-bold">{sim.points} PTS</span>
                  </div>

                  <h3 className="text-xl font-bold mb-2 group-hover:text-red-400 transition-colors">{sim.title}</h3>
                  <p className="text-slate-400 text-sm line-clamp-2 mb-4">{sim.description}</p>

                  <div className="flex items-center text-sm font-medium text-slate-500 group-hover:text-white transition-colors">
                    {isSolved ? 'Replay Simulation' : 'Start Simulation'} →
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {eventData.simulations.length === 0 && (
          <div className="text-center py-20">
            <p className="text-slate-500 text-lg">No challenges have been released for this event yet.</p>
            <p className="text-slate-600 text-sm mt-2">Wait for the admin to start the games.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function UsersIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
