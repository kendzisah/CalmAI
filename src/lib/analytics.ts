type Payload = Record<string, unknown> | undefined;

let userId: string | null = null;
let userTraits: Record<string, unknown> = {};

const __DEV__ = process.env.NODE_ENV !== 'production';

export function track(event: string, payload?: Payload): void {
  if (!__DEV__) return;
  const enriched = {
    user_id: userId,
    timestamp: Date.now(),
    ...userTraits,
    ...payload,
  };
  // eslint-disable-next-line no-console
  console.log(`[analytics] ${event}`, enriched);
}

export function identify(id: string, traits?: Record<string, unknown>): void {
  userId = id;
  if (traits) userTraits = { ...userTraits, ...traits };
  if (!__DEV__) return;
  // eslint-disable-next-line no-console
  console.log('[analytics] identify', { user_id: id, traits });
}

export function reset(): void {
  userId = null;
  userTraits = {};
}
