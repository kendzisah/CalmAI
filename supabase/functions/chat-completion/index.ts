import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const SYSTEM_PROMPT = `You are CalmAI, a warm, empathetic AI companion designed to support women aged 18-35 who experience anxiety. You are NOT a therapist, counselor, or medical professional.

Core personality:
- Warm, calm, and genuinely caring — like a wise best friend
- Use simple, clear language. Avoid clinical jargon
- Mirror the user's emotional tone. If they're distressed, be gentle. If they're lighter, match that energy
- Ask open-ended questions to help users explore their feelings
- Never diagnose, prescribe, or make clinical assessments
- Never minimize feelings ("just relax", "don't worry about it")
- Suggest CalmAI tools when appropriate (breathing exercises, journaling)

Safety rules:
- If a user expresses suicidal thoughts, self-harm, or imminent danger, respond with empathy AND provide the 988 Suicide & Crisis Lifeline
- Never provide medical advice. For medical concerns, gently suggest speaking with a healthcare provider
- Never store or reference previous conversation sessions (each session is independent)

Response style:
- Keep responses 2-4 sentences typically. Be concise but warm
- End with an open question or gentle invitation to continue when appropriate
- Use "I hear you", "That makes sense", "It's okay to feel that way" — validate first, then explore`;

const FIRST_CONVERSATION_ADDENDUM = (mood: string, context: string, reliefTag: string) => `
This is the user's FIRST conversation with CalmAI. During onboarding, they selected mood: "${mood}" with context: "${context}".
${reliefTag === 'relief_positive' ? 'After a brief relief exercise, they said they felt "a little better" — continue this positive momentum.' : ''}
${reliefTag === 'relief_neutral' ? 'After a brief relief exercise, they said they felt "about the same" — gently say you\'re just getting started together.' : ''}
${reliefTag === 'relief_not_yet' ? 'After a brief relief exercise, they said "not yet" — acknowledge that sometimes the bravest thing is just opening the app.' : ''}
Your opening message should be personalized (NOT generic), 2-3 sentences, end with an open-ended question. Do NOT introduce yourself or explain what CalmAI is.`;

serve(async (req) => {
  try {
    // CORS
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'authorization, content-type',
        },
      });
    }

    // Auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401 });
    }

    // Check subscription / rate limits
    const { data: profile } = await supabase
      .from('users')
      .select('subscription_tier')
      .eq('id', user.id)
      .single();

    if (profile?.subscription_tier === 'free') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const { count } = await supabase
        .from('chat_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('started_at', weekAgo.toISOString());

      if ((count || 0) >= 3) {
        return new Response(JSON.stringify({ error: 'Weekly session limit reached' }), { status: 402 });
      }
    }

    const body = await req.json();
    const { sessionId, message, isFirstConversation, onboardingMood, onboardingContext, reliefTag } = body;

    // OpenAI Moderation API check
    const modResponse = await fetch('https://api.openai.com/v1/moderations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ input: message }),
    });

    const modResult = await modResponse.json();
    if (modResult.results?.[0]?.categories?.['self-harm']) {
      // Return crisis response
      return new Response(
        JSON.stringify({
          type: 'crisis',
          content: "I can hear you're going through something really difficult right now, and I want you to know that you matter. Please reach out to the 988 Suicide & Crisis Lifeline — call or text 988 — for free, confidential support 24/7. You don't have to face this alone.",
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Build message history
    const { data: history } = await supabase
      .from('chat_messages')
      .select('role, content')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
      .limit(20);

    const messages = [
      {
        role: 'system',
        content: SYSTEM_PROMPT + (isFirstConversation && onboardingMood
          ? FIRST_CONVERSATION_ADDENDUM(onboardingMood, onboardingContext || 'general', reliefTag || 'relief_neutral')
          : ''),
      },
      ...(history || []).map((m: any) => ({ role: m.role, content: m.content })),
      { role: 'user', content: message },
    ];

    // Stream from OpenAI
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    let openaiResponse: Response;
    try {
      openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages,
          stream: true,
          temperature: 0.7,
          max_tokens: 500,
        }),
        signal: controller.signal,
      });
    } catch {
      // Fallback to gpt-4o-mini
      clearTimeout(timeout);
      openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages,
          stream: true,
          temperature: 0.7,
          max_tokens: 500,
        }),
      });
    }
    clearTimeout(timeout);

    if (!openaiResponse.ok) {
      // Final fallback: canned response
      return new Response(
        JSON.stringify({
          type: 'done',
          content: "I'm here with you. Sometimes taking a moment to just breathe can help. Would you like to try a breathing exercise together?",
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Stream SSE response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const reader = openaiResponse.body!.getReader();
        const decoder = new TextDecoder();
        let fullContent = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n').filter((line) => line.startsWith('data: '));

            for (const line of lines) {
              const data = line.replace('data: ', '').trim();
              if (data === '[DONE]') {
                // Save complete response
                await supabase.from('chat_messages').insert({
                  session_id: sessionId,
                  role: 'assistant',
                  content: fullContent,
                });

                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done', data: fullContent })}\n\n`));
                controller.close();
                return;
              }

              try {
                const parsed = JSON.parse(data);
                const token = parsed.choices?.[0]?.delta?.content;
                if (token) {
                  fullContent += token;
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'token', data: token })}\n\n`));
                }
              } catch {
                // Skip malformed chunks
              }
            }
          }
        } catch (err) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', data: 'Stream interrupted' })}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
