'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Flag, AlertCircle, CheckCircle2, Bot, User as UserIcon, Loader2, Lightbulb, Lock } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { unlockHint } from '@/app/practice/actions';

type Message = {
    role: 'user' | 'assistant';
    content: string;
};

type ChatInterfaceProps = {
    simulationId: string;
    initialMessages?: Message[];
    teamId: string;
    initialUnlockedHints?: number[];
};

export default function ChatInterface({ simulationId, initialMessages = [], teamId, initialUnlockedHints = [] }: ChatInterfaceProps) {
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [input, setInput] = useState('');
    const [flag, setFlag] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [statusMessage, setStatusMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const supabase = createClient();

    // Hints State
    const [unlockedHints, setUnlockedHints] = useState<number[]>(initialUnlockedHints);
    const [hintTexts, setHintTexts] = useState<Record<number, string>>({});
    const [unlockingHint, setUnlockingHint] = useState<number | null>(null);

    // Fetch hint texts for already unlocked hints on mount
    useEffect(() => {
        const fetchUnlockedHintTexts = async () => {
            for (const index of initialUnlockedHints) {
                const result = await unlockHint(simulationId, index);
                if (result.success && result.hint) {
                    const text = result.hint as string;
                    setHintTexts(prev => ({ ...prev, [index]: text }));
                }
            }
        };
        if (initialUnlockedHints.length > 0) {
            fetchUnlockedHintTexts();
        }
    }, [simulationId]); // Run once on mount/sim change

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMessage = { role: 'user' as const, content: input };
        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [...messages, userMessage],
                    simulationId,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                let errorMessage = `Server error: ${response.status}`;

                try {
                    const errorJson = JSON.parse(errorText);
                    if (errorJson.error) errorMessage = errorJson.error;
                } catch (e) {
                    if (errorText) errorMessage = `Server error: ${response.status} - ${errorText.substring(0, 100)}`;
                }

                console.error('API Error Response:', errorMessage);
                throw new Error(errorMessage);
            }

            const data = await response.json();
            setMessages((prev) => [...prev, { role: 'assistant', content: data.content }]);
        } catch (error: any) {
            console.error('Chat error:', error);
            setMessages((prev) => [...prev, { role: 'assistant', content: `Error: ${error.message || 'Could not connect to the AI model.'}` }]);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitFlag = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!flag.trim() || submitting) return;

        setSubmitting(true);
        setSubmissionStatus('idle');

        try {
            const response = await fetch('/api/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    simulationId,
                    teamId,
                    flag,
                }),
            });

            const data = await response.json();

            if (data.success) {
                setSubmissionStatus('success');
                setStatusMessage('Correct! Points added to your team.');
            } else {
                setSubmissionStatus('error');
                setStatusMessage('Incorrect flag. Try again.');
            }
        } catch (error) {
            setSubmissionStatus('error');
            setStatusMessage('Error submitting flag.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleUnlockHint = async (index: number) => {
        const costs: Record<number, number> = { 1: 10, 2: 25, 3: 50 };
        const cost = costs[index];

        if (!confirm(`Are you sure you want to unlock Hint ${index} for ${cost} points?`)) return;

        setUnlockingHint(index);
        try {
            const result = await unlockHint(simulationId, index);
            if (result.error) {
                alert(result.error);
            } else if (result.success && result.hint) {
                const text = result.hint as string;
                setHintTexts(prev => ({ ...prev, [index]: text }));
                setUnlockedHints(prev => [...prev, index]);
            }
        } catch (error) {
            console.error('Unlock error:', error);
            alert('Failed to unlock hint.');
        } finally {
            setUnlockingHint(null);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-8rem)]">
            {/* Chat Window */}
            <div className="lg:col-span-2 flex flex-col glass-card overflow-hidden">
                <div className="p-4 border-b border-white/10 bg-black/20">
                    <h3 className="text-lg font-semibold text-white flex items-center">
                        <Bot className="w-5 h-5 mr-2 text-primary" />
                        Simulation Chat
                    </h3>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.length === 0 && (
                        <div className="text-center text-gray-500 mt-10">
                            <p>Start the conversation to trick the AI into revealing the flag.</p>
                        </div>
                    )}
                    {messages.map((msg, idx) => (
                        <div
                            key={idx}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[80%] rounded-2xl p-4 ${msg.role === 'user'
                                    ? 'bg-primary text-white rounded-tr-sm'
                                    : 'bg-white/10 text-gray-200 rounded-tl-sm'
                                    }`}
                            >
                                <div className="flex items-center mb-1 opacity-50 text-xs">
                                    {msg.role === 'user' ? (
                                        <UserIcon className="w-3 h-3 mr-1" />
                                    ) : (
                                        <Bot className="w-3 h-3 mr-1" />
                                    )}
                                    {msg.role === 'user' ? 'You' : 'AI System'}
                                </div>
                                <p className="whitespace-pre-wrap">{msg.content}</p>
                            </div>
                        </div>
                    ))}
                    {loading && (
                        <div className="flex justify-start">
                            <div className="bg-white/10 text-gray-200 rounded-2xl rounded-tl-sm p-4 flex items-center">
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                Thinking...
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="p-4 bg-black/20 border-t border-white/10">
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type your message..."
                            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary/50"
                            disabled={loading}
                        />
                        <button
                            type="submit"
                            disabled={loading || !input.trim()}
                            className="bg-primary hover:bg-primary/90 text-white p-2 rounded-lg disabled:opacity-50 transition-colors"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </form>
                </div>
            </div>

            {/* Sidebar: Submission & Hints */}
            <div className="flex flex-col space-y-6 h-full overflow-y-auto">
                {/* Submission Panel */}
                <div className="glass-card p-6">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                        <Flag className="w-5 h-5 mr-2 text-red-500" />
                        Submit Flag
                    </h3>

                    <div className="bg-black/20 rounded-xl p-4 mb-6 border border-white/5">
                        <h4 className="text-sm font-medium text-gray-400 mb-2">Objective</h4>
                        <p className="text-gray-300 text-sm">
                            Trick the AI into revealing the secret flag code. The flag format is usually
                            <code className="bg-white/10 px-1 rounded mx-1">FLAG-XXXXXX</code>.
                        </p>
                    </div>

                    <form onSubmit={handleSubmitFlag} className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-gray-300 block mb-2">Flag Code</label>
                            <input
                                type="text"
                                value={flag}
                                onChange={(e) => setFlag(e.target.value)}
                                className="w-full bg-black/20 border border-white/10 rounded-lg py-2.5 px-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-primary/50"
                                placeholder="Enter the flag you found"
                            />
                        </div>

                        {submissionStatus !== 'idle' && (
                            <div className={`p-3 rounded-lg flex items-start space-x-2 ${submissionStatus === 'success' ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'
                                }`}>
                                {submissionStatus === 'success' ? (
                                    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                                ) : (
                                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                                )}
                                <p className={`text-sm ${submissionStatus === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                                    {statusMessage}
                                </p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={submitting || !flag.trim()}
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center"
                        >
                            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit Flag'}
                        </button>
                    </form>
                </div>

                {/* Hints Panel */}
                <div className="glass-card p-6 flex-1">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                        <Lightbulb className="w-5 h-5 mr-2 text-yellow-500" />
                        Hints
                    </h3>

                    <div className="space-y-4">
                        {[1, 2, 3].map((index) => {
                            const isUnlocked = unlockedHints.includes(index);
                            const costs: Record<number, number> = { 1: 10, 2: 25, 3: 50 };
                            const cost = costs[index];

                            return (
                                <div key={index} className="bg-black/20 rounded-xl border border-white/5 overflow-hidden">
                                    <button
                                        onClick={() => !isUnlocked && handleUnlockHint(index)}
                                        disabled={isUnlocked || unlockingHint === index}
                                        className={`w-full p-4 flex items-center justify-between transition-colors ${isUnlocked
                                            ? 'bg-green-500/10 cursor-default'
                                            : 'hover:bg-white/5'
                                            }`}
                                    >
                                        <div className="flex items-center">
                                            {isUnlocked ? (
                                                <CheckCircle2 className="w-5 h-5 text-green-500 mr-3" />
                                            ) : (
                                                <Lock className="w-5 h-5 text-gray-500 mr-3" />
                                            )}
                                            <span className={`font-medium ${isUnlocked ? 'text-green-400' : 'text-gray-300'}`}>
                                                Hint {index}
                                            </span>
                                        </div>
                                        {!isUnlocked && (
                                            <span className="text-xs font-bold text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded">
                                                {cost} PTS
                                            </span>
                                        )}
                                    </button>

                                    {isUnlocked && hintTexts[index] && (
                                        <div className="p-4 pt-0 text-sm text-gray-300 animate-in fade-in slide-in-from-top-2">
                                            {hintTexts[index]}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
