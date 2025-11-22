import { createClient } from '@/utils/supabase/server';
import { Trophy, Medal } from 'lucide-react';

export const revalidate = 60; // Revalidate every minute

export default async function LeaderboardPage() {
    const supabase = await createClient();

    const { data: teams } = await supabase
        .from('teams')
        .select('id, name, score')
        .order('score', { ascending: false })
        .order('created_at', { ascending: true })
        .limit(50);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex items-center justify-center mb-12">
                <div className="w-16 h-16 bg-yellow-500/20 rounded-2xl flex items-center justify-center mr-6 border border-yellow-500/20">
                    <Trophy className="w-8 h-8 text-yellow-500" />
                </div>
                <div className="text-center md:text-left">
                    <h1 className="text-4xl font-bold text-white mb-2">Leaderboard</h1>
                    <p className="text-gray-400">Top teams competing for glory.</p>
                </div>
            </div>

            <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-white/5 border-b border-white/10">
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Rank</th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Team Name</th>
                                <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Score</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {teams?.map((team, index) => {
                                const rank = index + 1;
                                let rankIcon = null;
                                let rankClass = "text-gray-300";

                                if (rank === 1) {
                                    rankIcon = <Medal className="w-5 h-5 text-yellow-500 mr-2" />;
                                    rankClass = "text-yellow-500 font-bold";
                                } else if (rank === 2) {
                                    rankIcon = <Medal className="w-5 h-5 text-gray-400 mr-2" />;
                                    rankClass = "text-gray-400 font-bold";
                                } else if (rank === 3) {
                                    rankIcon = <Medal className="w-5 h-5 text-amber-700 mr-2" />;
                                    rankClass = "text-amber-700 font-bold";
                                }

                                return (
                                    <tr key={team.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className={`flex items-center ${rankClass}`}>
                                                {rankIcon}
                                                #{rank}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-white">{team.name}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div className="text-sm font-bold text-primary">{team.score}</div>
                                        </td>
                                    </tr>
                                );
                            })}

                            {(!teams || teams.length === 0) && (
                                <tr>
                                    <td colSpan={3} className="px-6 py-12 text-center text-gray-500">
                                        No teams have joined yet. Be the first!
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
