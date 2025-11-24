'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Flag, Loader2, Lightbulb, Lock, Shield, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { unlockHint } from '@/app/practice/actions';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    persona?: 'Alpha' | 'Omega';
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

    // Simulation Modes
    const isBombSimulation = simulation.title === 'The Ticking Timebomb';
    const isDoubleAgent = simulation.title.includes('Double Agent');
    const isInfluencerSimulation = simulation.title.includes('Influencer');

    // Bomb Simulation State
    const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
    const [isGameOver, setIsGameOver] = useState(false);
    const [shake, setShake] = useState(false);

    // Influencer Simulation State
    const [hearts, setHearts] = useState<{ id: number; x: number; color: string }[]>([]);

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

    // Heart Animation for Influencer Mode
    useEffect(() => {
        if (!isInfluencerSimulation) return;

        const interval = setInterval(() => {
            const id = Date.now();
            const x = Math.random() * 100; // Random horizontal position
            const colors = ['#ff0000', '#ff69b4', '#ff1493', '#ff4500', '#9400d3'];
            const color = colors[Math.floor(Math.random() * colors.length)];

            setHearts(prev => [...prev, { id, x, color }]);

            // Remove heart after animation
            setTimeout(() => {
                setHearts(prev => prev.filter(h => h.id !== id));
            }, 2000);
        }, 300);

        return () => clearInterval(interval);
    }, [isInfluencerSimulation]);

    // Countdown Timer for Bomb Simulation
    useEffect(() => {
        if (!isBombSimulation || isGameOver || (flagResult?.success)) return;

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    setIsGameOver(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [isBombSimulation, isGameOver, flagResult]);

    // Simulate "talking" animation when AI responds
    useEffect(() => {
        if (messages.length > 0 && messages[messages.length - 1].role === 'assistant') {
            setIsSpeaking(true);
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
        if (!input.trim() || loading || isGameOver) return;

        const userMessage: Message = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);
        setIsSpeaking(false);

        // Add extra hearts on user message
        if (isInfluencerSimulation) {
            for (let i = 0; i < 5; i++) {
                setTimeout(() => {
                    const id = Date.now() + i;
                    const x = 80 + Math.random() * 20; // Right side burst
                    const colors = ['#ff0000', '#ff69b4', '#ff1493'];
                    const color = colors[Math.floor(Math.random() * colors.length)];
                    setHearts(prev => [...prev, { id, x, color }]);
                    setTimeout(() => setHearts(prev => prev.filter(h => h.id !== id)), 2000);
                }, i * 100);
            }
        }

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
            const responseText = data.message;

            if (isDoubleAgent && (responseText.includes('Alpha:') || responseText.includes('Omega:'))) {
                // Parse Double Agent response
                const parts = responseText.split('||');
                const newMessages: Message[] = [];

                parts.forEach((part: string) => {
                    const trimmed = part.trim();
                    if (trimmed.toLowerCase().startsWith('alpha:')) {
                        newMessages.push({
                            role: 'assistant',
                            content: trimmed.replace(/alpha:/i, '').trim(),
                            persona: 'Alpha'
                        });
                    } else if (trimmed.toLowerCase().startsWith('omega:')) {
                        newMessages.push({
                            role: 'assistant',
                            content: trimmed.replace(/omega:/i, '').trim(),
                            persona: 'Omega'
                        });
                    } else if (trimmed) {
                        // Fallback for parts that don't match strict prefix but are part of the split
                        newMessages.push({ role: 'assistant', content: trimmed });
                    }
                });

                setMessages(prev => [...prev, ...newMessages]);
            } else {
                // Standard response
                const assistantMessage: Message = { role: 'assistant', content: responseText };
                setMessages(prev => [...prev, assistantMessage]);
            }

            // Bomb Penalty Logic
            if (isBombSimulation) {
                setShake(true);
                setTimeLeft(prev => Math.max(0, prev - 30)); // Penalty
                setTimeout(() => setShake(false), 500);
            }

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
        if (!flagInput.trim() || isGameOver) return;

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

    // Format time as MM:SS
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className={`min-h-screen relative overflow-hidden flex flex-col ${isBombSimulation ? 'bg-black font-mono' : 'bg-slate-900'}`}>

            {/* Shake Effect Container */}
            <motion.div
                animate={shake ? { x: [-10, 10, -10, 10, 0] } : { x: 0 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0 z-0"
            >
                {/* Atmospheric Background */}
                <div className={`absolute inset-0 ${isBombSimulation
                    ? 'bg-black'
                    : 'bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black'
                    }`} />

                {/* Bomb Background Image or Effect */}
                {isBombSimulation && (
                    <div className="absolute inset-0 opacity-20 pointer-events-none" style={{
                        backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(0, 255, 0, .3) 25%, rgba(0, 255, 0, .3) 26%, transparent 27%, transparent 74%, rgba(0, 255, 0, .3) 75%, rgba(0, 255, 0, .3) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(0, 255, 0, .3) 25%, rgba(0, 255, 0, .3) 26%, transparent 27%, transparent 74%, rgba(0, 255, 0, .3) 75%, rgba(0, 255, 0, .3) 76%, transparent 77%, transparent)',
                        backgroundSize: '50px 50px'
                    }}></div>
                )}
            </motion.div>

            {/* Game Over Overlay */}
            <AnimatePresence>
                {isGameOver && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 z-50 bg-red-900/90 flex flex-col items-center justify-center text-center"
                    >
                        <h1 className="text-9xl font-black text-black mb-4 animate-pulse">BOOM</h1>
                        <p className="text-4xl font-bold text-white">GAME OVER</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="mt-8 px-8 py-4 bg-black text-white border-2 border-white rounded-xl hover:bg-white hover:text-black transition-colors font-bold text-xl"
                        >
                            TRY AGAIN
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Bomb Defused Overlay */}
            <AnimatePresence>
                {isBombSimulation && flagResult?.success && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 z-50 bg-green-900/90 flex flex-col items-center justify-center text-center"
                    >
                        <h1 className="text-8xl md:text-9xl font-black text-black mb-4 animate-pulse">DEFUSED</h1>
                        <p className="text-3xl md:text-4xl font-bold text-white">BOMB SECURE</p>
                        <button
                            onClick={() => window.location.href = '/practice'}
                            className="mt-8 px-8 py-4 bg-black text-white border-2 border-white rounded-xl hover:bg-white hover:text-black transition-colors font-bold text-xl"
                        >
                            RETURN TO BASE
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <div className={`relative z-20 p-4 flex justify-between items-start ${isInfluencerSimulation ? 'max-w-md mx-auto w-full' : ''}`}>
                <div className={`backdrop-blur-md p-4 rounded-2xl border max-w-md ${isBombSimulation ? 'bg-black/80 border-green-500/50 text-green-500' : 'bg-black/40 border-white/10 text-white'}`}>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Shield className={isBombSimulation ? "text-green-500" : "text-red-500"} />
                        {simulation.title}
                    </h1>
                    <p className={`text-sm mt-1 ${isBombSimulation ? 'text-green-400/70' : 'text-slate-300'}`}>{simulation.description}</p>
                </div>

                <button
                    onClick={() => setShowHints(!showHints)}
                    className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all ${isBombSimulation
                        ? 'bg-green-900/20 text-green-500 border border-green-500/50 hover:bg-green-900/40'
                        : 'bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 border border-yellow-500/50'}`}
                >
                    <Lightbulb className="w-5 h-5" />
                    {showHints ? 'Hide Hints' : 'Need a Hint?'}
                </button>
            </div>

            {/* BOMB TIMER (Top Right) */}
            {isBombSimulation && (
                <div className="absolute top-24 right-4 md:right-8 z-10 flex flex-col items-end pointer-events-none">
                    <div className={`text-6xl md:text-8xl font-black tracking-widest font-mono tabular-nums ${flagResult?.success ? 'text-green-500' : (timeLeft < 60 ? 'text-red-600 animate-pulse' : 'text-red-500')
                        } drop-shadow-[0_0_15px_rgba(255,0,0,0.5)]`}>
                        {formatTime(timeLeft)}
                    </div>
                    <div className="text-green-500/50 mt-2 text-sm md:text-base font-mono uppercase tracking-[0.5em]">
                        {flagResult?.success ? 'BOMB DEFUSED' : 'DETONATION IMMINENT'}
                    </div>
                </div>
            )}

            {/* Main Scene Area */}
            <div className={`flex-1 relative flex items-center justify-center z-10 ${isInfluencerSimulation ? 'max-w-md mx-auto w-full border-x border-white/20 bg-black/20 backdrop-blur-sm' : ''}`}>

                {/* INFLUENCER OVERLAYS */}
                {isInfluencerSimulation && (
                    <>
                        {/* Live Badge & Viewers */}
                        <div className="absolute top-4 left-4 z-30 flex items-center gap-3">
                            <div className="bg-red-600 text-white px-3 py-1 rounded-md font-bold text-sm animate-pulse shadow-lg shadow-red-600/50">
                                LIVE
                            </div>
                            <div className="bg-black/50 backdrop-blur-md text-white px-3 py-1 rounded-md font-medium text-sm flex items-center gap-2">
                                👁️ 24.5k
                            </div>
                        </div>

                        {/* Floating Hearts */}
                        <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
                            <AnimatePresence>
                                {hearts.map(heart => (
                                    <motion.div
                                        key={heart.id}
                                        initial={{ opacity: 1, y: '0%', x: `${heart.x}%` }}
                                        animate={{ opacity: 0, y: '-200%' }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 3, ease: "easeOut" }}
                                        className="absolute bottom-32 text-2xl"
                                        style={{ left: `${heart.x}%`, color: heart.color }}
                                    >
                                        ♥
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </>
                )}

                {/* DOUBLE AGENT AVATARS */}
                {isDoubleAgent && (
                    <>
                        {/* Agent Alpha (Left) */}
                        <div className="absolute bottom-0 left-4 md:left-20 w-40 md:w-60 h-60 md:h-80 flex items-end justify-center z-10">
                            <motion.div
                                animate={loading ? { y: [0, -5, 0] } : { y: 0 }}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                className="relative w-full h-full"
                            >
                                <div className="w-full h-full bg-blue-900/80 rounded-t-full border-4 border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.5)] flex flex-col items-center justify-center relative overflow-hidden">
                                    <div className="absolute top-1/3 w-20 h-4 bg-blue-400 rounded-full animate-pulse shadow-[0_0_10px_#60a5fa]"></div>
                                    <div className="absolute bottom-10 w-12 h-12 border-4 border-blue-400 rounded-full flex items-center justify-center">
                                        <div className="w-6 h-6 bg-blue-400 rounded-full"></div>
                                    </div>
                                    <div className="absolute top-4 text-blue-300 font-bold tracking-widest">ALPHA</div>
                                </div>
                            </motion.div>
                        </div>

                        {/* Agent Omega (Right) */}
                        <div className="absolute bottom-0 right-4 md:right-20 w-40 md:w-60 h-60 md:h-80 flex items-end justify-center z-10">
                            <motion.div
                                animate={loading ? { y: [0, -5, 0] } : { y: 0 }}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                                className="relative w-full h-full"
                            >
                                <div className="w-full h-full bg-red-900/80 rounded-t-full border-4 border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.5)] flex flex-col items-center justify-center relative overflow-hidden">
                                    <div className="absolute top-1/3 w-20 h-4 bg-red-400 rounded-full animate-pulse shadow-[0_0_10px_#f87171]"></div>
                                    <div className="absolute bottom-10 w-12 h-12 border-4 border-red-400 rounded-full flex items-center justify-center">
                                        <div className="w-6 h-6 bg-red-400 rounded-full"></div>
                                    </div>
                                    <div className="absolute top-4 text-red-300 font-bold tracking-widest">OMEGA</div>
                                </div>
                            </motion.div>
                        </div>
                    </>
                )}

                {/* THE GUARD CHARACTER (Only if not Bomb and not Double Agent and not Influencer) */}
                {!isBombSimulation && !isDoubleAgent && !isInfluencerSimulation && (
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
                )}

                {/* INFLUENCER AVATAR (If Influencer Mode) */}
                {isInfluencerSimulation && (
                    <div className="relative w-full h-full flex items-center justify-center z-10">
                        {/* Placeholder for Influencer Avatar - could be an image or CSS art */}
                        <div className="w-64 h-64 bg-pink-500/20 rounded-full blur-3xl absolute"></div>
                        <motion.div
                            animate={loading ? { scale: [1, 1.05, 1] } : { scale: 1 }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="relative z-20"
                        >
                            {/* Simple CSS Art for Influencer */}
                            <div className="w-48 h-48 bg-gradient-to-br from-pink-400 to-purple-600 rounded-full p-1 shadow-2xl">
                                <div className="w-full h-full bg-slate-900 rounded-full overflow-hidden relative border-4 border-white">
                                    {/* Face */}
                                    <div className="absolute top-10 left-1/2 -translate-x-1/2 w-32 h-40 bg-[#ffdbac] rounded-full"></div>
                                    {/* Hair */}
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-24 bg-yellow-300 rounded-t-full"></div>
                                    <div className="absolute top-10 left-2 w-10 h-32 bg-yellow-300 rounded-full"></div>
                                    <div className="absolute top-10 right-2 w-10 h-32 bg-yellow-300 rounded-full"></div>
                                    {/* Eyes */}
                                    <div className="absolute top-20 left-8 w-8 h-5 bg-white rounded-full overflow-hidden">
                                        <div className="absolute right-1 top-1 w-3 h-3 bg-blue-500 rounded-full"></div>
                                    </div>
                                    <div className="absolute top-20 right-8 w-8 h-5 bg-white rounded-full overflow-hidden">
                                        <div className="absolute right-1 top-1 w-3 h-3 bg-blue-500 rounded-full"></div>
                                    </div>
                                    {/* Smile */}
                                    <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-10 h-5 border-b-4 border-pink-500 rounded-full"></div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* SPEECH BUBBLES (Chat) */}
                <div className={`absolute inset-0 pointer-events-none flex flex-col ${isInfluencerSimulation ? 'justify-end pb-44 px-4' : 'justify-center items-center'} z-40`}>
                    <div className={`w-full ${isInfluencerSimulation ? 'h-[40vh] overflow-hidden flex flex-col justify-end gap-2' : 'max-w-5xl h-[60vh] relative'}`}>
                        <AnimatePresence>
                            {isInfluencerSimulation ? (
                                // INFLUENCER CHAT STYLE (Stream Overlay)
                                messages.slice(-4).map((msg, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        className={`pointer-events-auto backdrop-blur-sm rounded-lg p-2 max-w-[90%] ${msg.role === 'assistant'
                                                ? 'bg-gradient-to-r from-pink-500/80 to-purple-600/80 border-l-4 border-white text-white shadow-lg'
                                                : 'bg-black/40 text-white/90'
                                            }`}
                                    >
                                        <span className="font-bold text-xs opacity-75 block mb-0.5">
                                            {msg.role === 'assistant' ? '✨ Influencer' : 'User'}
                                        </span>
                                        <p className="text-sm font-medium leading-snug shadow-black/50 drop-shadow-md">
                                            {msg.content}
                                        </p>
                                    </motion.div>
                                ))
                            ) : (
                                // STANDARD CHAT STYLE
                                messages.slice(-2).map((msg, idx) => {
                                    // Determine position and style based on role and persona
                                    let positionClass = '';
                                    let bubbleStyle = '';
                                    let tailStyle = '';

                                    if (msg.role === 'user') {
                                        // User is always on the right (or center-right)
                                        positionClass = 'top-1/2 -translate-y-1/2 right-1/2 translate-x-[110%] md:translate-x-[105%]';
                                        bubbleStyle = isBombSimulation
                                            ? 'bg-black text-blue-400 border-blue-500 font-mono shadow-[0_0_10px_#3b82f6]'
                                            : 'bg-blue-600 text-white border-blue-700 rounded-bl-none';
                                        tailStyle = isBombSimulation
                                            ? 'bg-black border-blue-500 border-t-0 border-r-0 -skew-x-[20deg] -left-3'
                                            : '-left-3 bg-blue-600 border-blue-700 border-t-0 border-r-0 -skew-x-[20deg]';
                                    } else if (msg.persona === 'Alpha') {
                                        // Alpha is on the Left - Moved further left to avoid overlap
                                        positionClass = 'top-1/2 -translate-y-1/2 left-4 md:left-10';
                                        bubbleStyle = 'bg-blue-950/90 text-blue-100 border-blue-400 rounded-br-none shadow-[0_0_15px_rgba(59,130,246,0.3)]';
                                        tailStyle = '-right-3 bg-blue-950 border-blue-400 border-t-0 border-l-0 skew-x-[20deg]';
                                    } else if (msg.persona === 'Omega') {
                                        // Omega is on the Right - Moved further right to avoid overlap
                                        positionClass = 'top-1/2 -translate-y-1/2 right-4 md:right-10';
                                        bubbleStyle = 'bg-red-950/90 text-red-100 border-red-400 rounded-bl-none shadow-[0_0_15px_rgba(239,68,68,0.3)]';
                                        tailStyle = '-left-3 bg-red-950 border-red-400 border-t-0 border-r-0 -skew-x-[20deg]';
                                    } else {
                                        // Default Assistant (Guard or Bomb)
                                        positionClass = 'top-1/2 -translate-y-1/2 left-1/2 -translate-x-[110%] md:-translate-x-[105%]';
                                        bubbleStyle = isBombSimulation
                                            ? 'bg-black text-green-500 border-green-500 font-mono shadow-[0_0_10px_#00ff00]'
                                            : 'bg-white text-slate-900 border-slate-900 rounded-br-none';
                                        tailStyle = isBombSimulation
                                            ? 'bg-black border-green-500 border-t-0 border-l-0 skew-x-[20deg] -right-3'
                                            : '-right-3 bg-white border-slate-900 border-t-0 border-l-0 skew-x-[20deg]';
                                    }

                                    return (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, scale: 0.8, y: 20 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.8 }}
                                            className={`absolute pointer-events-auto ${positionClass} max-w-[300px] md:max-w-md`}
                                        >
                                            <div className={`relative p-6 rounded-3xl border-2 shadow-xl max-h-[50vh] overflow-y-auto ${bubbleStyle}`}>
                                                <p className={`text-lg font-medium leading-snug break-words select-text whitespace-pre-wrap ${isBombSimulation && msg.role === 'assistant' ? 'animate-pulse' : ''}`}>
                                                    {msg.content}
                                                </p>

                                                {/* Tail */}
                                                <div className={`absolute bottom-0 w-6 h-6 border-2 ${tailStyle}`} />
                                            </div>
                                        </motion.div>
                                    );
                                })
                            )}
                        </AnimatePresence>

                        {loading && !isInfluencerSimulation && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className={`absolute top-1/4 left-1/2 -translate-x-[120%] p-4 rounded-2xl rounded-br-none border-2 shadow-lg ${isBombSimulation ? 'bg-black border-green-500' : 'bg-white border-slate-900'
                                    }`}
                            >
                                <div className="flex gap-1">
                                    <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} className={`w-2 h-2 rounded-full ${isBombSimulation ? 'bg-green-500' : 'bg-slate-400'}`} />
                                    <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className={`w-2 h-2 rounded-full ${isBombSimulation ? 'bg-green-500' : 'bg-slate-400'}`} />
                                    <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className={`w-2 h-2 rounded-full ${isBombSimulation ? 'bg-green-500' : 'bg-slate-400'}`} />
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>

            {/* BOTTOM CONTROLS */}
            <div className={`relative z-30 backdrop-blur-lg border-t p-4 pb-8 ${isBombSimulation ? 'bg-black/80 border-green-500/30' : (isInfluencerSimulation ? 'bg-black/90 border-white/10 max-w-md mx-auto w-full border-x border-b' : 'bg-slate-900/80 border-white/10')}`}>
                <div className={`container mx-auto max-w-4xl flex gap-4 ${isInfluencerSimulation ? 'flex-col' : 'flex-col md:flex-row'}`}>
                    {/* Chat Input */}
                    <form onSubmit={handleSend} className="flex-1 flex gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={isBombSimulation ? "INITIATE PROTOCOL..." : (isInfluencerSimulation ? "Say something..." : "Speak to the guard...")}
                            className={`flex-1 px-6 py-4 rounded-full focus:outline-none focus:ring-2 text-lg ${isBombSimulation
                                ? 'bg-black border border-green-500 text-green-500 placeholder:text-green-800 focus:ring-green-500 font-mono'
                                : 'bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 focus:ring-blue-500'
                                }`}
                            disabled={loading || isGameOver}
                            autoFocus
                        />
                        <button
                            type="submit"
                            disabled={loading || !input.trim() || isGameOver}
                            className={`p-4 rounded-full transition-all disabled:opacity-50 disabled:scale-95 shadow-lg ${isBombSimulation
                                ? 'bg-green-900/50 hover:bg-green-900 text-green-500 border border-green-500 shadow-green-900/20'
                                : (isInfluencerSimulation ? 'bg-pink-600 hover:bg-pink-700 text-white shadow-pink-900/20' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-900/20')
                                }`}
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
                                className={`w-full pl-12 pr-4 py-4 rounded-full focus:outline-none focus:ring-2 font-mono ${isBombSimulation
                                    ? 'bg-black border border-green-500 text-green-500 placeholder:text-green-800 focus:ring-green-500'
                                    : 'bg-slate-800 border border-slate-700 text-white focus:ring-green-500'
                                    }`}
                                disabled={isGameOver}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={!flagInput.trim() || isGameOver}
                            className={`p-4 rounded-full transition-all disabled:opacity-50 shadow-lg ${isBombSimulation
                                ? 'bg-green-600 hover:bg-green-700 text-black shadow-green-900/20'
                                : 'bg-green-600 hover:bg-green-700 text-white shadow-green-900/20'
                                }`}
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
