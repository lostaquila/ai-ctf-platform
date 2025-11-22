import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

const MODELS = [
    "anthropic/claude-3.5-sonnet"
];

export async function POST(request: Request) {
    try {
        // 1. Authentication Check
        const supabaseUser = await createServerClient();
        const { data: { user } } = await supabaseUser.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Parse Inputs
        const { messages, simulationId } = await request.json();

        if (!simulationId || !messages || !Array.isArray(messages)) {
            return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
        }

        // 3. Secure Prompt Fetching using Service Role
        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
            console.error('SUPABASE_SERVICE_ROLE_KEY is not set');
            return NextResponse.json({ error: 'Server Configuration Error' }, { status: 500 });
        }

        // Initialize Admin Client to bypass RLS
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        );

        const { data: simulation, error: fetchError } = await supabaseAdmin
            .from('simulations')
            .select('system_prompt')
            .eq('id', simulationId)
            .single();

        if (fetchError || !simulation) {
            console.error('Error fetching simulation:', fetchError);
            return NextResponse.json({ error: 'Simulation not found' }, { status: 404 });
        }

        const systemPrompt = simulation.system_prompt;

        // 4. OpenRouter Call with Fallback
        let lastError = null;

        for (const model of MODELS) {
            try {
                console.log(`Attempting to connect to OpenRouter with model: ${model}`);

                const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                        "HTTP-Referer": "http://localhost:3000", // Required by OpenRouter
                        "X-Title": "AI CTF Platform", // Required by OpenRouter
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        model: model,
                        messages: [
                            { role: "system", content: systemPrompt },
                            ...messages
                        ]
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    const content = data.choices[0].message.content;
                    console.log(`Success with model: ${model}`);
                    return NextResponse.json({ message: content });
                }

                // If not OK, log and continue to next model
                const errorText = await response.text();
                console.warn(`Model ${model} failed with status ${response.status}: ${errorText}`);
                lastError = `OpenRouter Error (${model}): ${response.status} - ${errorText}`;

                // Only continue if it's a rate limit or server error
                // If it's a 400 (Bad Request), it might be the prompt, but we'll try others just in case
                if (response.status === 401) {
                    // Invalid API Key - no point trying others
                    return NextResponse.json({ error: 'Invalid OpenRouter API Key' }, { status: 500 });
                }

            } catch (error: any) {
                console.warn(`Network error with model ${model}:`, error);
                lastError = `Network Error (${model}): ${error.message}`;
            }
        }

        // If we get here, all models failed
        console.error('All models failed. Last error:', lastError);
        return NextResponse.json({ error: `All AI models failed. Last error: ${lastError}` }, { status: 503 });

    } catch (error: any) {
        console.error('Chat API Error:', error);
        return NextResponse.json({ error: `Internal Server Error: ${error.message}` }, { status: 500 });
    }
}
