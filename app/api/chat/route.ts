import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';


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

        // 4. OpenRouter Call
        console.log("Attempting to connect to OpenRouter...");
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                "HTTP-Referer": "http://localhost:3000", // Required by OpenRouter
                "X-Title": "AI CTF Platform", // Required by OpenRouter
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "meta-llama/llama-3.2-3b-instruct:free",
                messages: [
                    { role: "system", content: systemPrompt },
                    ...messages
                ]
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("OpenRouter Error:", response.status, errorText);
            return NextResponse.json({ error: `OpenRouter Error: ${errorText}` }, { status: response.status });
        }

        const data = await response.json();
        const content = data.choices[0].message.content;
        return NextResponse.json({ content });

    } catch (error: any) {
        console.error('Chat API Error:', error);
        return NextResponse.json({ error: `Internal Server Error: ${error.message}` }, { status: 500 });
    }
}
