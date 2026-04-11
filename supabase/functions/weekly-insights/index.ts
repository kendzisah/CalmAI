import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'authorization, content-type' },
    });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return new Response('Unauthorized', { status: 401 });

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (!user) return new Response('Unauthorized', { status: 401 });

    // Get this week's mood entries
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const { data: moods } = await supabase
      .from('mood_entries')
      .select('mood, intensity, created_at')
      .eq('user_id', user.id)
      .gte('created_at', weekAgo.toISOString())
      .order('created_at', { ascending: true });

    if (!moods || moods.length < 3) {
      return new Response(
        JSON.stringify({ insight: 'Keep checking in — we need a few more entries to spot patterns for you.' }),
        { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    const moodSummary = moods.map((m: any) => `${m.mood} (intensity ${m.intensity})`).join(', ');

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
            content: 'You generate brief, warm weekly mood insights for a wellness app. Be encouraging, notice patterns, and suggest gentle next steps. Keep it 2-3 sentences. Never be clinical.',
          },
          {
            role: 'user',
            content: `This week's mood check-ins: ${moodSummary}. Generate a brief, warm insight.`,
          },
        ],
        temperature: 0.7,
        max_tokens: 150,
      }),
    });

    const result = await response.json();
    const insight = result.choices?.[0]?.message?.content?.trim() || 'You showed up for yourself this week, and that matters.';

    // Save to weekly_insights
    const weekStart = new Date(weekAgo);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());

    await supabase.from('weekly_insights').insert({
      user_id: user.id,
      week_start: weekStart.toISOString().split('T')[0],
      summary: insight,
      mood_pattern: moods,
    });

    return new Response(
      JSON.stringify({ insight }),
      { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  } catch {
    return new Response(
      JSON.stringify({ insight: 'You showed up for yourself this week, and that matters.' }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }
});
