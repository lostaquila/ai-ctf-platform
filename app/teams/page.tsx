'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';
import { Users, Plus, LogIn, Copy, Check, AlertCircle, Loader2, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createTeamAction, joinTeamAction, leaveTeamAction } from './actions';

type Team = {
    id: string;
    name: string;
    join_code: string;
    score: number;
};

type Profile = {
    id: string;
    username: string;
    team_id: string | null;
};

export default function TeamsPage() {
    const [user, setUser] = useState<User | null>(null);
    const [team, setTeam] = useState<Team | null>(null);
    const [members, setMembers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [newTeamName, setNewTeamName] = useState('');
    const [joinCode, setJoinCode] = useState('');
    const [copied, setCopied] = useState(false);

    const supabase = createClient();
    const router = useRouter();

    const fetchTeamData = async (userId: string) => {
        // 1. Get user's profile to see if they have a team
        const { data: profile } = await supabase
            .from('profiles')
            .select('team_id, teams (*)')
            .eq('id', userId)
            .maybeSingle();

        if (profile?.teams) {
            // @ts-ignore
            setTeam(profile.teams);

            // 2. Fetch all members of this team
            const { data: teamMembers } = await supabase
                .from('profiles')
                .select('id, username, team_id')
                .eq('team_id', profile.team_id);

            if (teamMembers) {
                setMembers(teamMembers);
            }
        } else {
            setTeam(null);
            setMembers([]);
        }
    };

    useEffect(() => {
        const init = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    router.push('/login');
                    return;
                }
                setUser(user);
                await fetchTeamData(user.id);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        init();
    }, [supabase, router]);

    const handleCreateTeam = async (e: React.FormEvent) => {
        e.preventDefault();
        setActionLoading(true);
        setError(null);

        try {
            const result = await createTeamAction(newTeamName);
            if (result.error) {
                setError(result.error);
                return;
            }

            setTeam(result.team);
            // Refresh data to get members (including self via trigger)
            if (user) await fetchTeamData(user.id);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleJoinTeam = async (e: React.FormEvent) => {
        e.preventDefault();
        setActionLoading(true);
        setError(null);

        try {
            const result = await joinTeamAction(joinCode);
            if (result.error) {
                setError(result.error);
                return;
            }

            setTeam(result.team);
            // Refresh data to get members
            if (user) await fetchTeamData(user.id);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleLeaveTeam = async () => {
        if (!confirm('Are you sure you want to leave this team?')) return;

        setActionLoading(true);
        setError(null);

        try {
            const result = await leaveTeamAction();
            if (result.error) {
                setError(result.error);
                return;
            }

            setTeam(null);
            setMembers([]);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setActionLoading(false);
        }
    };

    const copyCode = () => {
        if (team?.join_code) {
            navigator.clipboard.writeText(team.join_code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h1 className="text-4xl font-bold text-white mb-8">Team Management</h1>

            {team ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Team Info Card */}
                    <div className="glass-card p-8">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-3xl font-bold text-white">{team.name}</h2>
                            <div className="bg-primary/20 text-primary px-4 py-1 rounded-full text-lg font-bold">
                                {team.score} Points
                            </div>
                        </div>

                        <div className="bg-black/20 rounded-xl p-6 mb-8 border border-white/5">
                            <label className="text-sm text-gray-400 block mb-2">Team Join Code</label>
                            <div className="flex items-center space-x-4">
                                <code className="text-3xl font-mono text-white tracking-wider">{team.join_code}</code>
                                <button
                                    onClick={copyCode}
                                    className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                                    title="Copy Code"
                                >
                                    {copied ? <Check className="w-6 h-6 text-green-500" /> : <Copy className="w-6 h-6" />}
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">Share this code with your teammates to let them join.</p>
                        </div>

                        <div className="mb-8">
                            <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                                <Users className="w-5 h-5 mr-2" />
                                Team Members ({members.length}/4)
                            </h3>
                            <div className="space-y-3">
                                {members.length > 0 ? (
                                    members.map((member) => (
                                        <div key={member.id} className="flex items-center bg-white/5 p-4 rounded-lg border border-white/5">
                                            <div className="w-10 h-10 bg-gradient-to-br from-primary to-purple-600 rounded-full flex items-center justify-center text-sm font-bold text-white mr-4">
                                                {member.username?.substring(0, 2).toUpperCase() || '??'}
                                            </div>
                                            <span className="text-gray-200 font-medium text-lg">{member.username || 'Unknown User'}</span>
                                            {member.id === user?.id && (
                                                <span className="ml-auto text-xs bg-primary/20 text-primary px-2 py-1 rounded border border-primary/20">You</span>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-gray-500 italic">No members found (Check RLS policies)</div>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={handleLeaveTeam}
                            disabled={actionLoading}
                            className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 font-bold py-3 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center"
                        >
                            {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                <>
                                    <LogOut className="w-5 h-5 mr-2" />
                                    Leave Team
                                </>
                            )}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Create Team */}
                    <div className="glass-card p-8">
                        <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-6">
                            <Plus className="w-6 h-6 text-primary" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-4">Create a Team</h2>
                        <p className="text-gray-400 mb-6">
                            Start a new squad and invite your friends. You'll be the team leader.
                        </p>
                        <form onSubmit={handleCreateTeam}>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-300 block mb-2">Team Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={newTeamName}
                                        onChange={(e) => setNewTeamName(e.target.value)}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg py-2.5 px-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
                                        placeholder="e.g. Prompt Wizards"
                                    />
                                </div>
                                {error && (
                                    <div className="text-red-400 text-sm flex items-center">
                                        <AlertCircle className="w-4 h-4 mr-1" />
                                        {error}
                                    </div>
                                )}
                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center"
                                >
                                    {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Team'}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Join Team */}
                    <div className="glass-card p-8">
                        <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-6">
                            <LogIn className="w-6 h-6 text-blue-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-4">Join a Team</h2>
                        <p className="text-gray-400 mb-6">
                            Have a code? Enter it here to join an existing squad.
                        </p>
                        <form onSubmit={handleJoinTeam}>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-300 block mb-2">Join Code</label>
                                    <input
                                        type="text"
                                        required
                                        value={joinCode}
                                        onChange={(e) => setJoinCode(e.target.value)}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg py-2.5 px-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 uppercase"
                                        placeholder="e.g. X7K9P2"
                                    />
                                </div>
                                {error && (
                                    <div className="text-red-400 text-sm flex items-center">
                                        <AlertCircle className="w-4 h-4 mr-1" />
                                        {error}
                                    </div>
                                )}
                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center border border-white/10"
                                >
                                    {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Join Team'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
