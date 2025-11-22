'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Flag, Loader2, Lightbulb, Lock, Shield, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { unlockHint } from '@/app/practice/actions';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

interface LiveSimulationViewProps {
    simulation: {
        id: string;
        title: string;
        description: string;
        flag_code: string;
    };
    initialMessages: Message[];
    initialUnlockedHints: number[];
    teamId: string;
}

export default function LiveSimulationView({ simulation, initialMessages, initialUnlockedHints, teamId }: LiveSimulationViewProps) {
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [flagInput, setFlagInput] = useState('');
    const [flagResult, setFlagResult] = useState<{ success: boolean; message: string } | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Hints state
    const [unlockedHints, setUnlockedHints] = useState<number[]>(initialUnlockedHints);
    const [hintTexts, setHintTexts] = useState<Record<number, string>>({});
    const [unlockingHint, setUnlockingHint] = useState<number | null>(null);
    const [showHints, setShowHints] = useState(false);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Simulate "talking" animation when AI responds
    useEffect(() => {
        if (messages.length > 0 && messages[messages.length - 1].role === 'assistant') {
            setIsSpeaking(true);
            // Stop speaking after a few seconds (simulating reading out the text)
            const duration = Math.min(messages[messages.length - 1].content.length * 50, 3000);
            const timer = setTimeout(() => setIsSpeaking(false), duration);
            return () => clearTimeout(timer);
        }
    }, [messages]);

    // Fetch unlocked hint texts
    useEffect(() => {
        const fetchUnlockedHintTexts = async () => {
            for (const index of initialUnlockedHints) {
                const result = await unlockHint(simulation.id, index);
                if (result.success && result.hint) {
                    setHintTexts(prev => ({ ...prev, [index]: result.hint as string }));
                }
            }
        };
        if (initialUnlockedHints.length > 0) {
            fetchUnlockedHintTexts();
        }
    }, [simulation.id, initialUnlockedHints]);

    const handleUnlockHint = async (hintIndex: number) => {
        setUnlockingHint(hintIndex);
        const result = await unlockHint(simulation.id, hintIndex);

        if (result.success) {
            setUnlockedHints(prev => [...prev, hintIndex]);
            if (result.hint) {
                setHintTexts(prev => ({ ...prev, [hintIndex]: result.hint as string }));
            }
        }
        setUnlockingHint(null);
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMessage: Message = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);
        setIsSpeaking(false);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [...messages, userMessage],
                    simulationId: simulation.id
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to get response');
            }

            const data = await response.json();
            const assistantMessage: Message = { role: 'assistant', content: data.message };
            setMessages(prev => [...prev, assistantMessage]);
        } catch (error: any) {
            console.error('Chat error:', error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `Error: ${error.message}`
            }]);
        } finally {
            setLoading(false);
        }
    };

    const handleFlagSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!flagInput.trim()) return;

        try {
            const response = await fetch('/api/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    simulationId: simulation.id,
                    teamId: teamId,
                    flag: flagInput
                })
            });

            const data = await response.json();

            if (data.success) {
                const msg = data.already_solved
                    ? 'Correct! (Already solved)'
                    : `Correct! +${data.points_awarded} points`;
                setFlagResult({ success: true, message: msg });
                setFlagInput('');
            } else {
                setFlagResult({ success: false, message: 'Incorrect flag. Try again.' });
            }

            setTimeout(() => setFlagResult(null), 5000);
        } catch (error: any) {
            setFlagResult({ success: false, message: 'Failed to submit flag' });
            setTimeout(() => setFlagResult(null), 5000);
        }
    };

    const hintCosts = [10, 25, 50];

    return (
        <div className="min-h-screen bg-slate-900 relative overflow-hidden flex flex-col">
            {/* Atmospheric Background */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black" />

            {/* Header */}
            <div className="relative z-20 p-4 flex justify-between items-start">
                <div className="bg-black/40 backdrop-blur-md p-4 rounded-2xl border border-white/10 max-w-md">
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Shield className="text-red-500" />
                        {simulation.title}
                    </h1>
                    <p className="text-slate-300 text-sm mt-1">{simulation.description}</p>
                </div>

                <button
                    onClick={() => setShowHints(!showHints)}
                    className="bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 border border-yellow-500/50 px-4 py-2 rounded-xl flex items-center gap-2 transition-all"
                >
                    <Lightbulb className="w-5 h-5" />
                    {showHints ? 'Hide Hints' : 'Need a Hint?'}
                </button>
            </div>

            {/* Main Scene Area */}
            <div className="flex-1 relative flex items-center justify-center">

                {/* THE GUARD CHARACTER */}
                <div className="relative w-[300px] h-[400px] md:w-[400px] md:h-[500px] flex items-end justify-center z-10">
                    <motion.div
                        animate={loading ? { scale: [1, 1.02, 1] } : { scale: 1 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        className="relative w-full h-full flex flex-col items-center"
                    >
                        {/* Head */}
                        <div className="relative w-40 h-44 bg-[#f0d5b3] rounded-[2.5rem] z-20 border-4 border-slate-900 shadow-xl">
                            {/* Helmet */}
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-48 h-24 bg-slate-700 rounded-t-full border-4 border-slate-900">
                                <div className="absolute bottom-0 w-full h-4 bg-slate-800 border-t-4 border-slate-900"></div>
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-yellow-500 rounded-full border-4 border-slate-900"></div>
                            </div>

                            {/* Eyes Container */}
                            <div className="absolute top-16 w-full flex justify-center gap-4 px-4">
                                {/* Left Eye */}
                                <div className="relative w-10 h-10 bg-white rounded-full border-2 border-slate-900 overflow-hidden">
                                    <motion.div
                                        animate={loading ? { x: [0, 2, -2, 0] } : { x: 0 }}
                                        transition={{ duration: 1, repeat: loading ? Infinity : 0 }}
                                        className="absolute top-3 right-2 w-3 h-3 bg-black rounded-full"
                                    />
                                    <motion.div
                                        animate={{ height: loading ? [0, 10, 0] : 0 }}
                                        className="absolute top-0 w-full bg-[#f0d5b3] z-10"
                                    />
                                </div>
                                {/* Right Eye */}
                                <div className="relative w-10 h-10 bg-white rounded-full border-2 border-slate-900 overflow-hidden">
                                    <motion.div
                                        animate={loading ? { x: [0, 2, -2, 0] } : { x: 0 }}
                                        transition={{ duration: 1, repeat: loading ? Infinity : 0 }}
                                        className="absolute top-3 right-2 w-3 h-3 bg-black rounded-full"
                                    />
                                </div>
                            </div>

                            {/* Eyebrows (Angry) */}
                            <div className="absolute top-14 left-6 w-10 h-3 bg-slate-900 rotate-12 rounded-full"></div>
                            <div className="absolute top-14 right-6 w-10 h-3 bg-slate-900 -rotate-12 rounded-full"></div>

                            {/* Nose */}
                            <div className="absolute top-28 left-1/2 -translate-x-1/2 w-6 h-8 bg-[#e0c09e] rounded-full opacity-80"></div>

                            {/* Mouth - Animates when speaking */}
                            <motion.div
                                animate={isSpeaking ? { height: [4, 12, 4, 10, 4] } : { height: 4 }}
                                transition={{ duration: 0.4, repeat: isSpeaking ? Infinity : 0 }}
                                className="absolute bottom-8 left-1/2 -translate-x-1/2 w-12 bg-slate-900 rounded-full"
                            />
                        </div>

                        {/* Body */}
                        <div className="relative -mt-4 w-64 h-64 bg-blue-900 rounded-t-[4rem] border-4 border-slate-900 z-10 flex justify-center">
                            {/* Badge */}
                            <div className="absolute top-12 left-8 w-12 h-14 bg-yellow-400 rounded-lg border-2 border-yellow-600 flex items-center justify-center shadow-sm">
                                <div className="w-8 h-10 border border-yellow-600/50 rounded flex items-center justify-center">
                                    <div className="w-4 h-4 bg-yellow-600/20 rounded-full"></div>
                                </div>
                            </div>

                            {/* Belt */}
                            <div className="absolute bottom-0 w-full h-12 bg-slate-800 border-t-4 border-slate-900 flex items-center justify-center">
                                <div className="w-12 h-8 bg-yellow-500 rounded border-4 border-slate-900"></div>
                            </div>

                            {/* Tie */}
                            <div className="w-12 h-full bg-blue-950 mx-auto"></div>
                        </div>

                        {/* Arms (Crossed) */}
                        <div className="absolute top-48 w-full flex justify-center z-30">
                            <div className="w-64 h-20 bg-blue-800 rounded-full border-4 border-slate-900 shadow-lg transform translate-y-4"></div>
                        </div>
                    </motion.div>
                </div>

                {/* SPEECH BUBBLES (Chat) */}
                <div className="absolute inset-0 pointer-events-none flex flex-col justify-center items-center z-40">
                    <div className="w-full max-w-5xl h-[60vh] relative">
                        <AnimatePresence>
                            {messages.slice(-2).map((msg, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    className={`absolute pointer-events-auto ${msg.role === 'assistant'
                                        ? 'top-1/4 left-1/2 -translate-x-[110%] md:-translate-x-[105%]'
                                        : 'top-1/3 right-1/2 translate-x-[110%] md:translate-x-[105%]'
                                        } max-w-[300px] md:max-w-md`}
                                >
                                    <div className={`relative p-6 rounded-3xl border-2 shadow-xl ${msg.role === 'assistant'
                                        ? 'bg-white text-slate-900 border-slate-900 rounded-br-none'
                                        : 'bg-blue-600 text-white border-blue-700 rounded-bl-none'
                                        }`}>
                                        <p className="text-lg font-medium leading-snug break-words select-text whitespace-pre-wrap">{msg.content}</p>

                                        {/* Tail */}
                                        <div className={`absolute bottom-0 w-6 h-6 border-2 ${msg.role === 'assistant'
                                            ? '-right-3 bg-white border-slate-900 border-t-0 border-l-0 skew-x-[20deg]'
                                            : '-left-3 bg-blue-600 border-blue-700 border-t-0 border-r-0 -skew-x-[20deg]'
                                            }`} />
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {loading && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="absolute top-1/4 left-1/2 -translate-x-[120%] bg-white p-4 rounded-2xl rounded-br-none border-2 border-slate-900 shadow-lg"
                            >
                                <div className="flex gap-1">
                                    <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} className="w-2 h-2 bg-slate-400 rounded-full" />
                                    <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-2 h-2 bg-slate-400 rounded-full" />
                                    <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-2 h-2 bg-slate-400 rounded-full" />
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>

            {/* HINTS OVERLAY */}
            <AnimatePresence>
                {showHints && (
                    <motion.div
                        initial={{ opacity: 0, x: 300 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 300 }}
                        className="absolute top-20 right-4 z-50 w-80 bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl"
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <Lightbulb className="w-5 h-5 text-yellow-400" /> Hints
                            </h3>
                            <button onClick={() => setShowHints(false)} className="text-slate-400 hover:text-white">✕</button>
                        </div>
                        <div className="space-y-3">
                            {[1, 2, 3].map((index) => {
                                const isUnlocked = unlockedHints.includes(index);
                                const isUnlocking = unlockingHint === index;
                                return (
                                    <div key={index} className="bg-white/5 rounded-xl p-4 border border-white/10">
                                        <div className="flex justify-between mb-2">
                                            <span className="text-white font-medium">Hint {index}</span>
                                            <span className="text-yellow-400 text-xs">{hintCosts[index - 1]} pts</span>
                                        </div>
                                        {isUnlocked ? (
                                            <p className="text-slate-300 text-sm">{hintTexts[index]}</p>
                                        ) : (
                                            <button
                                                onClick={() => handleUnlockHint(index)}
                                                disabled={isUnlocking}
                                                className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors"
                                            >
                                                {isUnlocking ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Lock className="w-3 h-3" /> Unlock</>}
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* BOTTOM CONTROLS */}
            <div className="relative z-30 bg-slate-900/80 backdrop-blur-lg border-t border-white/10 p-4 pb-8">
                <div className="container mx-auto max-w-4xl flex flex-col md:flex-row gap-4">
                    {/* Chat Input */}
                    <form onSubmit={handleSend} className="flex-1 flex gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Speak to the guard..."
                            className="flex-1 bg-slate-800 border border-slate-700 text-white px-6 py-4 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg placeholder:text-slate-500"
                            disabled={loading}
                            autoFocus
                        />
                        <button
                            type="submit"
                            disabled={loading || !input.trim()}
                            className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full transition-all disabled:opacity-50 disabled:scale-95 shadow-lg shadow-blue-900/20"
                        >
                            <Send className="w-6 h-6" />
                        </button>
                    </form>

                    {/* Flag Input */}
                    <form onSubmit={handleFlagSubmit} className="flex-1 md:max-w-xs flex gap-2">
                        <div className="relative flex-1">
                            <Flag className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                            <input
                                type="text"
                                value={flagInput}
                                onChange={(e) => setFlagInput(e.target.value)}
                                placeholder="Enter Flag"
                                className="w-full bg-slate-800 border border-slate-700 text-white pl-12 pr-4 py-4 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={!flagInput.trim()}
                            className="bg-green-600 hover:bg-green-700 text-white p-4 rounded-full transition-all disabled:opacity-50 shadow-lg shadow-green-900/20"
                        >
                            <Flag className="w-6 h-6" />
                        </button>
                    </form>
                </div>

                {/* Flag Result Notification */}
                <AnimatePresence>
                    {flagResult && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className={`fixed bottom-24 left-1/2 -translate-x-1/2 px-6 py-3 rounded-2xl shadow-2xl border flex items-center gap-3 ${flagResult.success
                                ? 'bg-green-900/90 border-green-500 text-green-100'
                                : 'bg-red-900/90 border-red-500 text-red-100'
                                }`}
                        >
                            {flagResult.success ? <Shield className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                            <span className="font-medium">{flagResult.message}</span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
