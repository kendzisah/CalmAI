import { useEffect, useCallback, useState } from 'react';
import { Alert } from 'react-native';
import Purchases, { PurchasesPackage, CustomerInfo } from 'react-native-purchases';
import { useSubscriptionStore } from '@/stores/subscriptionStore';
import { useAuthStore } from '@/stores/authStore';

const ENTITLEMENT_ID = 'Calm AI Premium';

export function useSubscription() {
  const { tier, setTier } = useSubscriptionStore();
  const userId = useAuthStore((s) => s.userId);
  const [offerings, setOfferings] = useState<{
    monthly?: PurchasesPackage;
    annual?: PurchasesPackage;
  }>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkEntitlements();
    loadOfferings();
  }, [userId]);

  const syncTier = (customerInfo: CustomerInfo) => {
    const isPro = typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== 'undefined';
    setTier(isPro ? 'pro' : 'free');
  };

  const checkEntitlements = useCallback(async () => {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      syncTier(customerInfo);
    } catch {
      // Default to free on error
    }
  }, [setTier]);

  const loadOfferings = useCallback(async () => {
    try {
      const offeringsResult = await Purchases.getOfferings();
      const current = offeringsResult.current;
      if (current) {
        setOfferings({
          monthly: current.monthly ?? undefined,
          annual: current.annual ?? undefined,
        });
      }
    } catch {
      // Offerings not available — paywall will show fallback prices
    }
  }, []);

  const purchasePackage = useCallback(async (pkg: PurchasesPackage | undefined) => {
    if (!pkg) {
      Alert.alert('Not Available', 'This plan is not available right now. Please try again later.');
      return;
    }
    try {
      setIsLoading(true);
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      syncTier(customerInfo);
    } catch (err: any) {
      if (!err.userCancelled) {
        Alert.alert('Purchase Failed', err.message || 'Something went wrong. Please try again.');
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [setTier]);

  const purchaseMonthly = useCallback(async () => {
    await purchasePackage(offerings.monthly);
  }, [offerings.monthly, purchasePackage]);

  const purchaseAnnual = useCallback(async () => {
    await purchasePackage(offerings.annual);
  }, [offerings.annual, purchasePackage]);

  const restorePurchases = useCallback(async () => {
    try {
      setIsLoading(true);
      const customerInfo = await Purchases.restorePurchases();
      syncTier(customerInfo);
      const isPro = typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== 'undefined';
      if (isPro) {
        Alert.alert('Restored', 'Your Pro subscription has been restored.');
      } else {
        Alert.alert('No Purchases Found', 'We could not find any previous purchases to restore.');
      }
    } catch (err: any) {
      Alert.alert('Restore Failed', err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [setTier]);

  return {
    tier,
    isPro: tier === 'pro',
    isLoading,
    offerings,
    purchaseMonthly,
    purchaseAnnual,
    restorePurchases,
    checkEntitlements,
  };
}
