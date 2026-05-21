import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  validateEnum,
  validateEnumArray,
  validateNickname,
} from '../_shared/sanitize.ts';
import {
  LOUD_CATEGORIES,
  TRIGGER_TIMES,
  COPING_PREFS,
  TONE_PREFS,
} from '../_shared/enums.ts';
import {
  generateOpener,
  localDate,
  STATIC_FALLBACK,
} from '../_shared/openerGen.ts';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const HISTORY_WINDOW = 10;

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
};

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), { status, headers: JSON_HEADERS });
}

serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'authorization, content-type',
        },
      });
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return jsonResponse({ error: 'Unauthorized' }, 401);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return jsonResponse({ error: 'Invalid token' }, 401);

    // Pro gate. CalmAI is subscription-only.
    const { data: profile } = await supabase
      .from('users')
      .select('subscription_tier, timezone')
      .eq('id', user.id)
      .single();

    if (profile?.subscription_tier !== 'pro') {
      return jsonResponse(
        { error: 'Active subscription required', fallback: STATIC_FALLBACK },
        402
      );
    }

    const date = localDate(profile.timezone);

    // Cache hit: return today's opener without invoking OpenAI.
    const { data: cached } = await supabase
      .from('daily_openers')
      .select('opener, source')
      .eq('user_id', user.id)
      .eq('local_date', date)
      .maybeSingle();

    if (cached?.opener) {
      return jsonResponse({ opener: cached.opener, source: cached.source, cache: 'hit' });
    }

    const body = await req.json().catch(() => ({}));
    const validatedPayload = {
      nickname: validateNickname(body.nickname),
      loudCategories: validateEnumArray(body.loudCategories, LOUD_CATEGORIES),
      triggerTimes: validateEnumArray(body.triggerTimes, TRIGGER_TIMES),
      copingPrefs: validateEnumArray(body.copingPrefs, COPING_PREFS),
      tonePref: validateEnum(body.tonePref, TONE_PREFS) ?? 'gentle',
    };

    // Pull the user's most recent chat history. Inner join keeps results
    // scoped to messages belonging to this user across all their sessions.
    const { data: recentMessages } = await supabase
      .from('chat_messages')
      .select('role, content, chat_sessions!inner(user_id)')
      .eq('chat_sessions.user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(HISTORY_WINDOW);

    const history = (recentMessages ?? [])
      .reverse()
      .map((m: { role: string; content: string }) => ({
        role: m.role,
        content: m.content,
      }));

    const { opener, source } = await generateOpener(OPENAI_API_KEY, validatedPayload, history);

    // Persist so subsequent reads (and the daily push job) see the same line.
    await supabase
      .from('daily_openers')
      .upsert(
        { user_id: user.id, local_date: date, opener, source },
        { onConflict: 'user_id,local_date' }
      );

    return jsonResponse({ opener, source, cache: 'miss' });
  } catch (err) {
    console.error('[chat-opener] unhandled error:', err);
    return jsonResponse({ opener: STATIC_FALLBACK, source: 'static' });
  }
});
