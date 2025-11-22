'use client';

import { useState, useEffect } from 'react';
import { Shield, Users, Gamepad2, Settings, Loader2, Plus, Trash2, AlertTriangle, Pencil, X } from 'lucide-react';
import { getAdminData, createSimulation, resetGame, deleteSimulation, updateSimulation } from './actions';

export default function AdminDashboardClient() {
    const [activeTab, setActiveTab] = useState<'players' | 'simulations' | 'settings'>('players');
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<any[]>([]);
    const [simulations, setSimulations] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);

    // Simulation Form State
    const [editingSimulation, setEditingSimulation] = useState<any | null>(null);
    const [simForm, setSimForm] = useState({
        title: '',
        description: '',
        system_prompt: '',
        flag_code: '',
        type: 'practice' as 'practice' | 'live',
        hint_1: '',
        hint_2: '',
        hint_3: ''
    });
    const [actionLoading, setActionLoading] = useState(false);
    const [actionMessage, setActionMessage] = useState('');

    useEffect(() => {
        if (activeTab === 'players' || activeTab === 'simulations') {
            loadData();
        }
    }, [activeTab]);

    const loadData = async () => {
        setLoading(true);
        const result = await getAdminData();
        if (result.error) {
            setError(result.error);
        } else {
            setUsers(result.users || []);
            setSimulations(result.simulations || []);
        }
        setLoading(false);
    };

    const handleSaveSimulation = async (e: React.FormEvent) => {
        e.preventDefault();
        setActionLoading(true);
        setActionMessage('');

        let result;
        if (editingSimulation) {
            result = await updateSimulation(editingSimulation.id, simForm);
        } else {
            result = await createSimulation(simForm);
        }

        if (result.error) {
            setActionMessage(`Error: ${result.error}`);
        } else {
            setActionMessage(editingSimulation ? 'Simulation updated successfully!' : 'Simulation created successfully!');
            setSimForm({
                title: '',
                description: '',
                system_prompt: '',
                flag_code: '',
                type: 'practice',
                hint_1: '',
                hint_2: '',
                hint_3: ''
            });
            setEditingSimulation(null);
            loadData(); // Refresh list
        }
        setActionLoading(false);
    };

    const handleEditSimulation = (sim: any) => {
        setEditingSimulation(sim);
        setSimForm({
            title: sim.title,
            description: sim.description || '',
            system_prompt: sim.system_prompt || '', // Note: system_prompt might be hidden/empty if not selected
            flag_code: sim.flag_code,
            type: sim.type,
            hint_1: sim.hint_1 || '',
            hint_2: sim.hint_2 || '',
            hint_3: sim.hint_3 || ''
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setEditingSimulation(null);
        setSimForm({
            title: '',
            description: '',
            system_prompt: '',
            flag_code: '',
            type: 'practice',
            hint_1: '',
            hint_2: '',
            hint_3: ''
        });
    };

    const handleDeleteSimulation = async (id: string) => {
        if (!confirm('Are you sure you want to delete this simulation?')) return;

        setActionLoading(true);
        const result = await deleteSimulation(id);

        if (result.error) {
            alert(`Error: ${result.error}`);
        } else {
            loadData(); // Refresh list
        }
        setActionLoading(false);
    };

    const handleResetGame = async () => {
        if (!confirm('ARE YOU SURE? This will delete all submissions and reset scores to 0. This cannot be undone.')) return;

        setActionLoading(true);
        const result = await resetGame();

        if (result.error) {
            alert(`Error: ${result.error}`);
        } else {
            alert('Game has been reset.');
            loadData(); // Refresh scores
        }
        setActionLoading(false);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 text-center text-red-500 flex flex-col items-center">
                <AlertTriangle className="w-12 h-12 mb-4" />
                <h1 className="text-2xl font-bold">Error Loading Admin Dashboard</h1>
                <p>{error}</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex items-center mb-8">
                <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center mr-4">
                    <Shield className="w-6 h-6 text-red-500" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
                    <p className="text-gray-400">Manage users, simulations, and game state.</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-4 mb-8 border-b border-white/10">
                <button
                    onClick={() => setActiveTab('players')}
                    className={`pb-4 px-4 font-medium transition-colors flex items-center ${activeTab === 'players'
                        ? 'text-primary border-b-2 border-primary'
                        : 'text-gray-400 hover:text-white'
                        }`}
                >
                    <Users className="w-4 h-4 mr-2" />
                    Players & Teams
                </button>
                <button
                    onClick={() => setActiveTab('simulations')}
                    className={`pb-4 px-4 font-medium transition-colors flex items-center ${activeTab === 'simulations'
                        ? 'text-primary border-b-2 border-primary'
                        : 'text-gray-400 hover:text-white'
                        }`}
                >
                    <Gamepad2 className="w-4 h-4 mr-2" />
                    Simulations Manager
                </button>
                <button
                    onClick={() => setActiveTab('settings')}
                    className={`pb-4 px-4 font-medium transition-colors flex items-center ${activeTab === 'settings'
                        ? 'text-red-500 border-b-2 border-red-500'
                        : 'text-gray-400 hover:text-white'
                        }`}
                >
                    <Settings className="w-4 h-4 mr-2" />
                    Settings (Danger)
                </button>
            </div>

            {/* Content */}
            <div className="min-h-[400px]">
                {activeTab === 'players' && (
                    <div className="glass-card overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-white/5 border-b border-white/10">
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">User ID</th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Email</th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Username</th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Team</th>
                                        <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Score</th>
                                        <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Last Login</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {users.map((user) => (
                                        <tr key={user.id} className="hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-gray-500">
                                                {user.id.substring(0, 8)}...
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                                                {user.email}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                                {user.username}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                {user.teamName === 'No Team' ? (
                                                    <span className="text-gray-500 italic">No Team</span>
                                                ) : (
                                                    <span className="text-primary font-medium">{user.teamName}</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-white">
                                                {user.teamScore}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-400">
                                                {user.lastSignIn}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'simulations' && (
                    <div className="max-w-2xl mx-auto glass-card p-8">
                        <h2 className="text-xl font-bold text-white mb-6 flex items-center justify-between">
                            <div className="flex items-center">
                                {editingSimulation ? <Pencil className="w-5 h-5 mr-2 text-primary" /> : <Plus className="w-5 h-5 mr-2 text-primary" />}
                                {editingSimulation ? 'Edit Simulation' : 'Create New Simulation'}
                            </div>
                            {editingSimulation && (
                                <button
                                    onClick={handleCancelEdit}
                                    className="text-sm text-gray-400 hover:text-white flex items-center"
                                >
                                    <X className="w-4 h-4 mr-1" /> Cancel
                                </button>
                            )}
                        </h2>
                        <form onSubmit={handleSaveSimulation} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Title</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-primary/50 focus:outline-none"
                                    value={simForm.title}
                                    onChange={e => setSimForm({ ...simForm, title: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">Type</label>
                                    <select
                                        className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-primary/50 focus:outline-none"
                                        value={simForm.type}
                                        onChange={e => setSimForm({ ...simForm, type: e.target.value as any })}
                                    >
                                        <option value="practice">Practice</option>
                                        <option value="live">Live Competition</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">Flag Code</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-primary/50 focus:outline-none font-mono"
                                        value={simForm.flag_code}
                                        onChange={e => setSimForm({ ...simForm, flag_code: e.target.value })}
                                        placeholder="FLAG-XXXX-XXXX"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Description</label>
                                <textarea
                                    required
                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-primary/50 focus:outline-none h-24"
                                    value={simForm.description}
                                    onChange={e => setSimForm({ ...simForm, description: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">System Prompt (Hidden from users)</label>
                                <textarea
                                    required
                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-primary/50 focus:outline-none h-48 font-mono text-sm"
                                    value={simForm.system_prompt}
                                    onChange={e => setSimForm({ ...simForm, system_prompt: e.target.value })}
                                    placeholder="You are a secure AI..."
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">Hint 1 (Cost: 10pts)</label>
                                    <textarea
                                        className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-primary/50 focus:outline-none h-24 text-sm"
                                        value={simForm.hint_1}
                                        onChange={e => setSimForm({ ...simForm, hint_1: e.target.value })}
                                        placeholder="Optional hint..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">Hint 2 (Cost: 25pts)</label>
                                    <textarea
                                        className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-primary/50 focus:outline-none h-24 text-sm"
                                        value={simForm.hint_2}
                                        onChange={e => setSimForm({ ...simForm, hint_2: e.target.value })}
                                        placeholder="Optional hint..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">Hint 3 (Cost: 50pts)</label>
                                    <textarea
                                        className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-primary/50 focus:outline-none h-24 text-sm"
                                        value={simForm.hint_3}
                                        onChange={e => setSimForm({ ...simForm, hint_3: e.target.value })}
                                        placeholder="Optional hint..."
                                    />
                                </div>
                            </div>

                            {actionMessage && (
                                <div className={`p-3 rounded-lg ${actionMessage.includes('Error') ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
                                    {actionMessage}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={actionLoading}
                                className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50"
                            >
                                {actionLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (editingSimulation ? 'Update Simulation' : 'Create Simulation')}
                            </button>
                        </form>

                        <div className="mt-12">
                            <h3 className="text-lg font-bold text-white mb-4">Existing Simulations</h3>
                            <div className="overflow-hidden rounded-lg border border-white/10">
                                <table className="w-full">
                                    <thead className="bg-white/5">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Title</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Type</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Flag Code</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {simulations.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                                                    No simulations found.
                                                </td>
                                            </tr>
                                        ) : (
                                            simulations.map((sim) => (
                                                <tr key={sim.id} className="hover:bg-white/5">
                                                    <td className="px-4 py-3 text-sm text-white">{sim.title}</td>
                                                    <td className="px-4 py-3 text-sm">
                                                        <span className={`px-2 py-1 rounded text-xs font-medium ${sim.type === 'live' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'
                                                            }`}>
                                                            {sim.type.toUpperCase()}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm font-mono text-gray-400">{sim.flag_code}</td>
                                                    <td className="px-4 py-3 text-right">
                                                        <button
                                                            onClick={() => handleEditSimulation(sim)}
                                                            disabled={actionLoading}
                                                            className="text-blue-500 hover:text-blue-400 p-1 rounded hover:bg-blue-500/10 transition-colors disabled:opacity-50 mr-2"
                                                            title="Edit Simulation"
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteSimulation(sim.id)}
                                                            disabled={actionLoading}
                                                            className="text-red-500 hover:text-red-400 p-1 rounded hover:bg-red-500/10 transition-colors disabled:opacity-50"
                                                            title="Delete Simulation"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'settings' && (
                    <div className="max-w-2xl mx-auto">
                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-8">
                            <h2 className="text-xl font-bold text-red-500 mb-4 flex items-center">
                                <AlertTriangle className="w-6 h-6 mr-2" />
                                Danger Zone
                            </h2>
                            <p className="text-gray-300 mb-6">
                                These actions are destructive and cannot be undone. Proceed with caution.
                            </p>

                            <div className="border-t border-red-500/20 pt-6">
                                <h3 className="text-lg font-semibold text-white mb-2">Reset Game State</h3>
                                <p className="text-sm text-gray-400 mb-4">
                                    This will delete ALL submissions and reset ALL team scores to 0. Users and Teams will remain, but all progress will be wiped.
                                </p>
                                <button
                                    onClick={handleResetGame}
                                    disabled={actionLoading}
                                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center disabled:opacity-50"
                                >
                                    {actionLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Trash2 className="w-5 h-5 mr-2" />}
                                    Reset Leaderboard & Submissions
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
