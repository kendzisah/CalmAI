import { useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import { useSubscriptionStore } from '@/stores/subscriptionStore';
import type { SubscriptionTier } from '@/types/user';

// RevenueCat will be initialized here once the SDK is installed
// For now, this provides the interface and falls back to free tier

const PRODUCT_IDS = {
  monthly: 'calm_pro_monthly',
  annual: 'calm_pro_annual',
};

export function useSubscription() {
  const { tier, setTier } = useSubscriptionStore();

  useEffect(() => {
    // TODO: Initialize RevenueCat
    // Purchases.configure({ apiKey: Platform.OS === 'ios' ? IOS_KEY : ANDROID_KEY });
    // Check current entitlements
    checkEntitlements();
  }, []);

  const checkEntitlements = useCallback(async () => {
    try {
      // TODO: Replace with actual RevenueCat call
      // const customerInfo = await Purchases.getCustomerInfo();
      // const isPro = customerInfo.entitlements.active['pro']?.isActive;
      // setTier(isPro ? 'pro' : 'free');
    } catch {
      // Default to free
    }
  }, [setTier]);

  const purchaseMonthly = useCallback(async () => {
    try {
      // TODO: Replace with actual RevenueCat purchase
      // const { customerInfo } = await Purchases.purchaseProduct(PRODUCT_IDS.monthly);
      // if (customerInfo.entitlements.active['pro']) setTier('pro');
      console.log('Purchase monthly — RevenueCat not yet configured');
    } catch (err) {
      throw err;
    }
  }, [setTier]);

  const purchaseAnnual = useCallback(async () => {
    try {
      // TODO: Replace with actual RevenueCat purchase
      // const { customerInfo } = await Purchases.purchaseProduct(PRODUCT_IDS.annual);
      // if (customerInfo.entitlements.active['pro']) setTier('pro');
      console.log('Purchase annual — RevenueCat not yet configured');
    } catch (err) {
      throw err;
    }
  }, [setTier]);

  const restorePurchases = useCallback(async () => {
    try {
      // TODO: Replace with actual RevenueCat restore
      // const customerInfo = await Purchases.restorePurchases();
      // const isPro = customerInfo.entitlements.active['pro']?.isActive;
      // setTier(isPro ? 'pro' : 'free');
      console.log('Restore purchases — RevenueCat not yet configured');
    } catch (err) {
      throw err;
    }
  }, [setTier]);

  return {
    tier,
    isPro: tier === 'pro',
    purchaseMonthly,
    purchaseAnnual,
    restorePurchases,
    checkEntitlements,
  };
}
