-- Daily opener delivery and personalization.
--
-- Adds two columns to public.users so the server cron knows where and when
-- to push the daily opener (Expo push token + IANA timezone), plus a new
-- daily_openers table that stores the generated opener per user per local
-- calendar date. The cron job and the chat-opener edge function both write
-- to and read from this table.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS expo_push_token TEXT,
  ADD COLUMN IF NOT EXISTS timezone TEXT,
  ADD COLUMN IF NOT EXISTS notification_hour SMALLINT
    CHECK (notification_hour IS NULL OR (notification_hour BETWEEN 0 AND 23)),
  ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS public.daily_openers (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  local_date DATE NOT NULL,
  opener TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'ai' CHECK (source IN ('ai', 'static')),
  delivered_push_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, local_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_openers_local_date
  ON public.daily_openers (local_date);

ALTER TABLE public.daily_openers ENABLE ROW LEVEL SECURITY;

-- Users see only their own openers. The edge functions use the service role
-- and bypass RLS for cron writes.
CREATE POLICY "Users read own daily openers"
  ON public.daily_openers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own daily openers"
  ON public.daily_openers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- pg_cron schedule. Runs every hour at minute 0. The daily-openers edge
-- function reads the current UTC hour, joins against users.timezone to find
-- subscribers whose local hour matches their notification_hour, and pushes.
--
-- Note: pg_cron must be enabled in the project (Supabase Dashboard:
-- Database → Extensions → pg_cron). The function URL below uses the project
-- ref placeholder; replace before applying or set via env.

-- Example invocation (uncomment after enabling pg_cron and setting the URL):
--
-- SELECT cron.schedule(
--   'daily-openers-hourly',
--   '0 * * * *',
--   $$
--   SELECT net.http_post(
--     url := 'https://<PROJECT_REF>.supabase.co/functions/v1/daily-openers',
--     headers := jsonb_build_object(
--       'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
--       'Content-Type', 'application/json'
--     ),
--     body := '{}'::jsonb
--   );
--   $$
-- );
