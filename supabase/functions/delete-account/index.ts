import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

    // Delete all user data across all tables (GDPR/CCPA compliance)
    const tables = [
      'weekly_insights',
      'subscription_events',
      'chat_messages', // via cascade from chat_sessions
      'chat_sessions',
      'breathing_sessions',
      'journal_entries',
      'mood_entries',
      'users',
    ];

    // chat_messages are deleted via CASCADE from chat_sessions
    for (const table of tables) {
      if (table === 'chat_messages') continue; // handled by cascade
      await supabase.from(table).delete().eq('user_id', user.id);
    }

    // Delete the auth user (this also cascades to public.users via FK)
    await supabase.auth.admin.deleteUser(user.id);

    return new Response(
      JSON.stringify({ ok: true, message: 'Account and all data permanently deleted' }),
      { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Account deletion failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
