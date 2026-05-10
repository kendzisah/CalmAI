import Purchases, { LOG_LEVEL } from 'react-native-purchases';

let configured = false;

export function configurePurchases(apiKey: string | undefined): void {
  if (configured) return;
  if (!apiKey) {
    if (__DEV__) {
      console.warn('[RevenueCat] EXPO_PUBLIC_REVENUECAT_KEY is not set — purchases disabled.');
    }
    return;
  }
  try {
    // LOG_LEVEL.VERBOSE / DEBUG triggers a known crash in @expo/metro-runtime
    // under the New Architecture — its HMRClient.log path tries to construct
    // a NamelessError via wrapNativeSuper and fails. Stick to ERROR.
    Purchases.setLogLevel(LOG_LEVEL.ERROR);
    Purchases.configure({ apiKey });
    configured = true;
  } catch (err) {
    if (__DEV__) console.error('[RevenueCat] configure failed', err);
  }
}

export function isPurchasesReady(): boolean {
  return configured;
}

// Fire-and-forget identity link. No-ops if Purchases isn't configured —
// prevents a native NSException crash on builds that ship without the key.
export async function safePurchasesLogIn(userId: string): Promise<void> {
  if (!configured) return;
  try {
    await Purchases.logIn(userId);
  } catch {
    // Non-critical — entitlement check will retry later.
  }
}

export async function safeGetCustomerInfo(): Promise<Awaited<ReturnType<typeof Purchases.getCustomerInfo>> | null> {
  if (!configured) return null;
  try {
    return await Purchases.getCustomerInfo();
  } catch {
    return null;
  }
}
