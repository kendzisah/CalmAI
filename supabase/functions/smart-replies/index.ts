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
    const { lastAssistantMessage } = await req.json();

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
            content: 'You generate 3 short quick-reply options for a wellness chat app. Each reply should be 2-6 words, natural, and encourage the conversation. Return as JSON array of strings.',
          },
          {
            role: 'user',
            content: `The AI just said: "${lastAssistantMessage}". Generate 3 quick reply options the user might want to send.`,
          },
        ],
        temperature: 0.8,
        max_tokens: 100,
      }),
    });

    const result = await response.json();
    let replies: string[];

    try {
      replies = JSON.parse(result.choices?.[0]?.message?.content || '[]');
    } catch {
      replies = ['Tell me more', 'That helps', "I'm not sure"];
    }

    return new Response(
      JSON.stringify({ replies }),
      { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  } catch {
    return new Response(
      JSON.stringify({ replies: ['Tell me more', 'That helps', "I'm not sure"] }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }
});
