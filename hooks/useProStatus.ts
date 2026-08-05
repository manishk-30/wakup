import { useState, useEffect, useCallback } from 'react';
import { CustomerInfo } from 'react-native-purchases';
import { subscriptionService } from '../services/subscriptionService';

export function useProStatus() {
  const [isPro, setIsPro] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      const proStatus = await subscriptionService.isPro();
      const info = await subscriptionService.getCustomerInfo();
      setIsPro(proStatus);
      setCustomerInfo(info);
    } catch (e) {
      console.error('[useProStatus] Error fetching status:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();

    const unsubscribe = subscriptionService.addListener((info: CustomerInfo) => {
      setCustomerInfo(info);
      // Explicitly check for the 'Pro' entitlement configured in RevenueCat
      const proStatus = typeof info.entitlements.active['Pro'] !== 'undefined';
      setIsPro(proStatus);
    });

    return () => {
      unsubscribe();
    };
  }, [fetchStatus]);

  return { isPro, customerInfo, isLoading, refetch: fetchStatus };
}
