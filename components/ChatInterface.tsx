'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Flag, AlertCircle, CheckCircle2, Bot, User as UserIcon, Loader2 } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

type Message = {
    role: 'user' | 'assistant';
    content: string;
};

type ChatInterfaceProps = {
    simulationId: string;
    initialMessages?: Message[];
    teamId: string;
};

export default function ChatInterface({ simulationId, initialMessages = [], teamId }: ChatInterfaceProps) {
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [input, setInput] = useState('');
    const [flag, setFlag] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [statusMessage, setStatusMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const supabase = createClient();

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
                    // If parsing fails, use the raw text if available, or fall back to status
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

            {/* Submission Panel */}
            <div className="glass-card p-6 flex flex-col">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                    <Flag className="w-5 h-5 mr-2 text-red-500" />
                    Submit Flag
                </h3>

                <div className="flex-1">
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
            </div>
        </div>
    );
}
