import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, content-type',
      },
    });
  }

  try {
    const { mood } = await req.json();

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You generate gentle, introspective journal prompts for a wellness app. The user is a young woman experiencing anxiety. Generate ONE prompt that is warm, non-clinical, and invites self-reflection. Return only the prompt text, no quotes or extra formatting.',
          },
          {
            role: 'user',
            content: mood
              ? `Generate a journal prompt for someone feeling ${mood}.`
              : 'Generate a general self-reflection journal prompt.',
          },
        ],
        temperature: 0.9,
        max_tokens: 100,
      }),
    });

    const result = await response.json();
    const prompt = result.choices?.[0]?.message?.content?.trim() || 'What is one thing you are grateful for right now?';

    return new Response(
      JSON.stringify({ prompt }),
      { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  } catch {
    return new Response(
      JSON.stringify({ prompt: 'What is one thing you are grateful for right now?' }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }
});
