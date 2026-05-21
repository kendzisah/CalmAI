// Analytics fan-out: console (dev) + AppsFlyer (ads) + PostHog (product).
//
// Internal call sites use `track(event, payload)`. This module decides which
// downstream destinations receive each event:
//   - AppsFlyer: only the af_* mapped subset (ad partners need standard names)
//   - PostHog:   every event in full granularity (funnels, retention, paths)
//   - console:   all events in __DEV__
//
// AppsFlyer is loaded via `require()` so the module doesn't hard-fail when the
// SDK package isn't yet installed in a working tree. PostHog uses a setter so
// the React PostHogProvider in _layout.tsx can hand us the client at boot.

import { Platform } from 'react-native';
import type { PostHog } from 'posthog-react-native';
import type { PostHogEventProperties } from '@posthog/core';

type Payload = Record<string, unknown> | undefined;

type AFEvent = { name: string; params: Record<string, unknown> };

// Lazy SDK handle — set on first call once require() resolves. Lets the rest
// of the app run (in dev/web/before-install) without crashing.
let af: any = null;
let afInitialized = false;

function loadAppsFlyer(): any {
  if (af) return af;
  try {
    af = require('react-native-appsflyer').default ?? require('react-native-appsflyer');
  } catch {
    if (__DEV__) console.warn('[analytics] react-native-appsflyer not installed — events log to console only');
    af = null;
  }
  return af;
}

let userId: string | null = null;
let userTraits: Record<string, unknown> = {};

// PostHog handle — set by PostHogProvider at app boot via setPostHogClient().
// Until then, calls no-op. Queued identify() metadata is replayed on attach so
// users who completed onboarding before the SDK was ready still get linked.
let phClient: PostHog | null = null;
let pendingIdentify: { id: string; traits: Record<string, unknown> } | null = null;

export function setPostHogClient(client: PostHog | null): void {
  phClient = client;
  if (client && pendingIdentify) {
    try {
      client.identify(pendingIdentify.id, pendingIdentify.traits as PostHogEventProperties);
    } catch (err) {
      if (__DEV__) console.warn('[analytics] PostHog replay identify failed', err);
    }
    pendingIdentify = null;
  }
  if (client && pendingSuperProps) {
    try {
      client.register(pendingSuperProps as PostHogEventProperties);
    } catch (err) {
      if (__DEV__) console.warn('[analytics] PostHog replay register failed', err);
    }
    pendingSuperProps = null;
  }
}

// Super-properties get attached to every subsequent event AND merged into the
// user when identify() fires. Used to stamp install attribution (media_source,
// campaign) from AppsFlyer onto the anonymous distinct_id before sign-in.
let pendingSuperProps: Record<string, unknown> | null = null;
export function registerSuperProperties(props: Record<string, unknown>): void {
  if (phClient) {
    try {
      phClient.register(props as PostHogEventProperties);
    } catch (err) {
      if (__DEV__) console.warn('[analytics] PostHog register failed', err);
    }
  } else {
    pendingSuperProps = { ...(pendingSuperProps ?? {}), ...props };
  }
}

// Report a caught exception to PostHog Error Tracking. PostHog auto-attaches
// distinct_id, session, and stack trace. The `properties` arg is for context
// tags (feature, error_category, etc.) — useful for filtering in the Errors
// dashboard.
export function captureException(err: unknown, properties?: Record<string, unknown>): void {
  if (__DEV__) console.warn('[analytics] captureException', err, properties);
  if (!phClient) return;
  try {
    const error = err instanceof Error ? err : new Error(String(err));
    phClient.captureException(error, (properties ?? {}) as PostHogEventProperties);
  } catch (e) {
    if (__DEV__) console.warn('[analytics] PostHog captureException failed', e);
  }
}

/**
 * Initialize AppsFlyer. Call once at app boot from app/_layout.tsx. Safe to
 * call without keys — the SDK silently no-ops if devKey/appId are missing,
 * matching the configurePurchases pattern in src/lib/purchases.ts.
 */
export function initAppsFlyer(devKey: string | undefined, appId: string | undefined): void {
  if (afInitialized) return;
  if (Platform.OS !== 'ios') return; // iOS-only initial scope per plan
  if (!devKey) {
    if (__DEV__) console.warn('[analytics] EXPO_PUBLIC_APPSFLYER_DEV_KEY is not set — AppsFlyer disabled');
    return;
  }
  const sdk = loadAppsFlyer();
  if (!sdk) return;

  // Register the install attribution listener BEFORE initSdk so AF doesn't
  // miss the conversion-data event for first launches. We stamp media_source
  // and campaign as PostHog super-properties so every subsequent event
  // (and the eventual identify) carries the install source.
  try {
    sdk.onInstallConversionData((res: unknown) => {
      const payload = (res as any)?.data ?? res;
      if (!payload || typeof payload !== 'object') return;
      const props: Record<string, unknown> = {
        media_source: payload.media_source ?? payload.pid ?? 'unknown',
        campaign: payload.campaign ?? 'unknown',
        is_organic: String(payload.af_status ?? '').toLowerCase() === 'organic',
        af_status: payload.af_status,
      };
      registerSuperProperties(props);
    });
  } catch (err) {
    if (__DEV__) console.warn('[analytics] onInstallConversionData listener failed', err);
  }

  sdk.initSdk(
    {
      devKey,
      appId,
      isDebug: __DEV__,
      onInstallConversionDataListener: true,
      // Defer startSdk up to 60s while we wait for ATT to resolve. The ATT
      // prompt is shown at paywall-soft (post-onboarding) for higher opt-in.
      timeToWaitForATTUserAuthorization: 60,
    },
    () => {
      afInitialized = true;
      if (__DEV__) console.log('[analytics] AppsFlyer initialized');
    },
    (err: unknown) => {
      if (__DEV__) console.warn('[analytics] AppsFlyer init failed', err);
    }
  );
}

/**
 * Returns the AppsFlyer device UID. Used to wire the RevenueCat → AppsFlyer
 * server-side integration via `Purchases.setAttributes({ '$appsflyerId': ... })`.
 */
export async function getAppsFlyerUID(): Promise<string | null> {
  const sdk = loadAppsFlyer();
  if (!sdk || Platform.OS !== 'ios') return null;
  return new Promise((resolve) => {
    try {
      sdk.getAppsFlyerUID((_err: unknown, uid: string) => resolve(uid ?? null));
    } catch {
      resolve(null);
    }
  });
}

function logAF(event: AFEvent): void {
  const sdk = loadAppsFlyer();
  if (!sdk || Platform.OS !== 'ios') return;
  try {
    sdk.logEvent(event.name, event.params, undefined, (err: unknown) => {
      if (__DEV__) console.warn('[analytics] logEvent failed', event.name, err);
    });
  } catch (err) {
    if (__DEV__) console.warn('[analytics] logEvent threw', event.name, err);
  }
}

// -- EVENT MAPPING ----------------------------------------------------------
//
// Each entry takes the internal track() payload and returns one or more
// AppsFlyer events. Internal events not listed here log to console only.
//
// All af_* names + parameter keys are AppsFlyer standard ones that both
// TikTok and Meta auto-map to their native event taxonomies via AF's S2S
// integration (Registration, AchieveLevel/LevelComplete, ViewContent, etc.).

type Mapper = (payload: Record<string, unknown>) => AFEvent | AFEvent[];

const EVENT_MAP: Record<string, Mapper> = {
  // ---- Onboarding funnel (steps 1..11) ----
  onboarding_hero_viewed: () => ({ name: 'af_tutorial_started', params: {} }),

  onboarding_preframe1_cta_tapped: () => ({
    name: 'af_level_achieved',
    params: { af_level: 2, af_description: 'preframe1' },
  }),
  onboarding_preframe2_cta_tapped: () => ({
    name: 'af_level_achieved',
    params: { af_level: 3, af_description: 'preframe2' },
  }),
  onboarding_nickname_submitted: () => ({
    name: 'af_level_achieved',
    params: { af_level: 4, af_description: 'nickname' },
  }),
  onboarding_loud_submitted: () => ({
    name: 'af_level_achieved',
    params: { af_level: 5, af_description: 'loud' },
  }),
  onboarding_timing_submitted: () => ({
    name: 'af_level_achieved',
    params: { af_level: 6, af_description: 'timing' },
  }),
  onboarding_coping_submitted: () => ({
    name: 'af_level_achieved',
    params: { af_level: 7, af_description: 'coping' },
  }),
  onboarding_tone_submitted: () => ({
    name: 'af_level_achieved',
    params: { af_level: 8, af_description: 'tone' },
  }),
  onboarding_confirm_cta_tapped: () => ({
    name: 'af_level_achieved',
    params: { af_level: 9, af_description: 'confirm' },
  }),
  onboarding_proof_cta_tapped: () => ({
    name: 'af_level_achieved',
    params: { af_level: 10, af_description: 'proof' },
  }),

  // ---- Sign-in / registration ----
  signin_viewed: () => ({
    name: 'af_content_view',
    params: { af_content_type: 'signin' },
  }),
  signin_completed: (p) => ({
    name: 'af_complete_registration',
    params: {
      af_registration_method: String(p.method ?? 'unknown'),
    },
  }),

  // ---- Activation (key first action — strong predictor of trial→paid) ----
  chat_first_message_replied: () => ({
    name: 'af_content_view',
    params: { af_content_type: 'first_chat_reply' },
  }),

  // ---- Soft paywall / onboarding complete ----
  paywall_soft_viewed: () => [
    { name: 'af_complete_tutorial', params: {} },
    { name: 'af_content_view', params: { af_content_type: 'soft_paywall' } },
  ],
  paywall_soft_primary_tapped: () => ({
    name: 'af_initiated_checkout',
    params: { af_content_type: 'soft_paywall' },
  }),

  // ---- Hard paywall ----
  paywall_pricing_viewed: () => ({
    name: 'af_content_view',
    params: { af_content_type: 'pricing' },
  }),
  paywall_yearly_selected: (p) => ({
    name: 'af_add_to_cart',
    params: {
      af_content_id: String(p.product_id ?? 'annual'),
      af_price: Number(p.price ?? 0),
      af_currency: String(p.currency ?? 'USD'),
    },
  }),
  paywall_monthly_selected: (p) => ({
    name: 'af_add_to_cart',
    params: {
      af_content_id: String(p.product_id ?? 'monthly'),
      af_price: Number(p.price ?? 0),
      af_currency: String(p.currency ?? 'USD'),
    },
  }),
  paywall_purchase_attempted: (p) => ({
    name: 'af_initiated_checkout',
    params: {
      af_content_id: String(p.product_id ?? p.plan ?? 'unknown'),
      af_price: Number(p.price ?? 0),
      af_currency: String(p.currency ?? 'USD'),
      af_quantity: 1,
    },
  }),

  // Trial / purchase / renewal events are owned by RevenueCat's server-side
  // AppsFlyer integration — single source of truth, catches App Store-initiated
  // trials, cross-device restore, and post-install renewals/conversions that
  // the client can't observe. RC posts af_start_trial / af_subscribe directly
  // to AppsFlyer with full revenue + product context. See RC dashboard →
  // Integrations → AppsFlyer for the event-name mapping.
  //
  // paywall_purchase_succeeded still fires internally (see useSubscription.ts)
  // for console/debug visibility — it just doesn't forward to AppsFlyer.

  // ---- Restore / failures (custom — no partner-native equivalent) ----
  paywall_restore: (p) => ({
    name: 'restore_purchase',
    params: { restored: Boolean(p.restored) },
  }),
  paywall_purchase_failed: (p) => ({
    name: 'purchase_failed',
    params: {
      error_code: String(p.error_code ?? 'unknown'),
      error_category: String(p.error_category ?? 'unknown'),
    },
  }),

  // Internal-only signal: not forwarded to TikTok/Meta. Mapped to a custom AF
  // event so AppsFlyer Raw Data exports include it for our own internal
  // dashboards, without ever flowing to ad partners (which would be a privacy
  // red flag for a mental-health app).
  crisis_detected: (p) => ({
    name: 'crisis_detected',
    params: { message_length: Number(p.message_length ?? 0) },
  }),

  // ---- Notifications (opt-in is a soft proxy for engaged users) ----
  notify_granted: () => ({
    name: 'notification_opt_in',
    params: { channel: 'push' },
  }),
};

export function track(event: string, payload?: Payload): void {
  const enriched: Record<string, unknown> = {
    user_id: userId,
    timestamp: Date.now(),
    ...userTraits,
    ...(payload ?? {}),
  };

  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.log(`[analytics] ${event}`, enriched);
  }

  // PostHog: every event, full payload. Drives funnels, retention, paths.
  if (phClient) {
    try {
      phClient.capture(event, enriched as PostHogEventProperties);
    } catch (err) {
      if (__DEV__) console.warn('[analytics] PostHog capture failed', event, err);
    }
  }

  // AppsFlyer: only mapped af_* events forwarded to ad partners.
  const mapper = EVENT_MAP[event];
  if (!mapper) return;
  const result = mapper(payload ?? {});
  const events = Array.isArray(result) ? result : [result];
  for (const e of events) logAF(e);
}

export function identify(id: string, traits?: Record<string, unknown>): void {
  userId = id;
  if (traits) userTraits = { ...userTraits, ...traits };
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.log('[analytics] identify', { user_id: id, traits });
  }

  // PostHog: link the anonymous distinct_id to this user. PostHog auto-stitches
  // events captured before identify() to the user once linked.
  if (phClient) {
    try {
      phClient.identify(id, (traits ?? {}) as PostHogEventProperties);
    } catch (err) {
      if (__DEV__) console.warn('[analytics] PostHog identify failed', err);
    }
  } else {
    // Provider not attached yet — queue and replay on setPostHogClient.
    pendingIdentify = { id, traits: traits ?? {} };
  }

  const sdk = loadAppsFlyer();
  if (!sdk || Platform.OS !== 'ios') return;
  try {
    sdk.setCustomerUserId(id, () => {});
    // Non-PII traits only — never pass nickname/email here (App Store privacy).
    if (traits) sdk.setAdditionalData(traits, () => {});
  } catch (err) {
    if (__DEV__) console.warn('[analytics] AF identify failed', err);
  }
}

export function reset(): void {
  userId = null;
  userTraits = {};
  pendingIdentify = null;

  if (phClient) {
    try {
      phClient.reset();
    } catch {
      // Ignore — provider may be tearing down.
    }
  }

  const sdk = loadAppsFlyer();
  if (!sdk || Platform.OS !== 'ios') return;
  try {
    sdk.setCustomerUserId('', () => {});
  } catch {
    // Ignore — SDK may not be initialized yet.
  }
}
