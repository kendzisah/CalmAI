import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  generateOpener,
  localDate,
  localHour,
  STATIC_FALLBACK,
} from '../_shared/openerGen.ts';

// Hourly cron entrypoint. Supabase pg_cron POSTs to this function once per
// hour. For every Pro user whose timezone-local hour equals their stored
// notification_hour right now, generate (or fetch cached) opener, persist
// to daily_openers, and push via the Expo Push API.

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const CRON_SECRET = Deno.env.get('CRON_SECRET') || '';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const PUSH_BATCH_SIZE = 100;
const HISTORY_WINDOW = 10;

const JSON_HEADERS = {
  'Content-Type': 'application/json',
};

interface PushMessage {
  to: string;
  title: string;
  body: string;
  sound: null;
  data: { type: 'daily_opener'; local_date: string };
}

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), { status, headers: JSON_HEADERS });
}

async function sendPushBatch(messages: PushMessage[]): Promise<void> {
  if (messages.length === 0) return;
  try {
    await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });
  } catch (err) {
    console.error('[daily-openers] push batch failed:', err);
  }
}

serve(async (req) => {
  try {
    // Cron-only endpoint. Reject anything without the shared secret.
    if (CRON_SECRET) {
      const authHeader = req.headers.get('Authorization') ?? '';
      const expected = `Bearer ${CRON_SECRET}`;
      if (authHeader !== expected) {
        return jsonResponse({ error: 'forbidden' }, 403);
      }
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Pull every Pro user with notifications enabled and a push token. We
    // filter to the matching local hour in JS because Postgres has no clean
    // way to do per-row timezone arithmetic without a function.
    const { data: users, error } = await supabase
      .from('users')
      .select('id, expo_push_token, timezone, notification_hour, display_name, subscription_tier, notifications_enabled')
      .eq('subscription_tier', 'pro')
      .eq('notifications_enabled', true)
      .not('expo_push_token', 'is', null)
      .not('notification_hour', 'is', null);

    if (error) {
      console.error('[daily-openers] user query failed:', error);
      return jsonResponse({ error: 'query failed' }, 500);
    }

    const candidates = (users ?? []).filter((u) => {
      const hour = localHour(u.timezone);
      return hour === u.notification_hour;
    });

    let generated = 0;
    let pushed = 0;
    const pushQueue: PushMessage[] = [];

    for (const u of candidates) {
      const date = localDate(u.timezone);

      // Cache-first. If today's opener already exists (e.g. user opened
      // chat earlier today and chat-opener generated one), reuse the same
      // line for the push so the lock-screen and chat tab stay in sync.
      const { data: existing } = await supabase
        .from('daily_openers')
        .select('opener, delivered_push_at')
        .eq('user_id', u.id)
        .eq('local_date', date)
        .maybeSingle();

      let opener: string;

      if (existing?.opener) {
        if (existing.delivered_push_at) {
          // Already pushed today. Skip to avoid double-fire if the cron
          // hits the same user twice (e.g. timezone DST edge cases).
          continue;
        }
        opener = existing.opener;
      } else {
        // Need to generate. Pull profile + history first.
        const [{ data: profile }, { data: onboarding }, { data: recentMessages }] =
          await Promise.all([
            supabase
              .from('users')
              .select('display_name')
              .eq('id', u.id)
              .single(),
            // Onboarding details live on a separate row in some schemas, but
            // the canonical app stores them on public.users via display_name
            // and elsewhere. Fall back to empty arrays here; the static
            // fallback covers the missing-profile case gracefully.
            Promise.resolve({ data: null }),
            supabase
              .from('chat_messages')
              .select('role, content, chat_sessions!inner(user_id)')
              .eq('chat_sessions.user_id', u.id)
              .order('created_at', { ascending: false })
              .limit(HISTORY_WINDOW),
          ]);

        const history = (recentMessages ?? [])
          .reverse()
          .map((m: { role: string; content: string }) => ({
            role: m.role,
            content: m.content,
          }));

        const result = await generateOpener(
          OPENAI_API_KEY,
          {
            nickname: profile?.display_name ?? null,
            loudCategories: [],
            triggerTimes: [],
            copingPrefs: [],
            tonePref: 'gentle',
          },
          history
        );

        opener = result.opener;

        await supabase
          .from('daily_openers')
          .upsert(
            { user_id: u.id, local_date: date, opener, source: result.source },
            { onConflict: 'user_id,local_date' }
          );

        generated += 1;
      }

      pushQueue.push({
        to: u.expo_push_token!,
        title: 'CalmAI',
        body: opener,
        sound: null,
        data: { type: 'daily_opener', local_date: date },
      });

      // Mark delivered_push_at upfront so subsequent ticks within the same
      // hour skip this user even if Expo Push is slow to confirm.
      await supabase
        .from('daily_openers')
        .update({ delivered_push_at: new Date().toISOString() })
        .eq('user_id', u.id)
        .eq('local_date', date);

      if (pushQueue.length >= PUSH_BATCH_SIZE) {
        await sendPushBatch(pushQueue.splice(0, PUSH_BATCH_SIZE));
        pushed += PUSH_BATCH_SIZE;
      }
    }

    if (pushQueue.length > 0) {
      pushed += pushQueue.length;
      await sendPushBatch(pushQueue);
    }

    return jsonResponse({
      candidates: candidates.length,
      generated,
      pushed,
      fallback: STATIC_FALLBACK,
    });
  } catch (err) {
    console.error('[daily-openers] unhandled error:', err);
    return jsonResponse({ error: 'internal' }, 500);
  }
});
