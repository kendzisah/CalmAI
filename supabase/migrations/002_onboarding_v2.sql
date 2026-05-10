-- Onboarding v1.3 — captures the new personalization signals from the rewritten funnel.
-- See CalmAI_Onboarding_Spec_v1.md §4.

CREATE TABLE IF NOT EXISTS public.user_onboarding (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname TEXT,
  loud_categories JSONB NOT NULL DEFAULT '[]'::jsonb,
  trigger_times JSONB NOT NULL DEFAULT '[]'::jsonb,
  coping_prefs JSONB NOT NULL DEFAULT '[]'::jsonb,
  tone_pref TEXT,
  suggested_notification_hour SMALLINT,
  notifications_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  relief_gratitude_text TEXT,
  email_is_relay BOOLEAN NOT NULL DEFAULT FALSE,
  completed_step SMALLINT NOT NULL DEFAULT 0,
  is_complete BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-touch updated_at on writes.
CREATE OR REPLACE FUNCTION public.touch_user_onboarding_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_onboarding_updated_at ON public.user_onboarding;
CREATE TRIGGER user_onboarding_updated_at
  BEFORE UPDATE ON public.user_onboarding
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_user_onboarding_updated_at();

-- RLS — user can only see / mutate their own row.
ALTER TABLE public.user_onboarding ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_onboarding_select_own ON public.user_onboarding;
CREATE POLICY user_onboarding_select_own ON public.user_onboarding
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS user_onboarding_insert_own ON public.user_onboarding;
CREATE POLICY user_onboarding_insert_own ON public.user_onboarding
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS user_onboarding_update_own ON public.user_onboarding;
CREATE POLICY user_onboarding_update_own ON public.user_onboarding
  FOR UPDATE USING (auth.uid() = user_id);
