import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL, PurchasesPackage, CustomerInfo } from 'react-native-purchases';

// Your RevenueCat API Key
const API_KEY_APPLE = 'appl_FOrEjBfhifvAwBWcqPfGKrOYWdB';
// const API_KEY_GOOGLE = 'goog_...'; // For future Android release

class SubscriptionService {
  private isInitialized = false;

  async setup() {
    if (this.isInitialized) return;

    try {
      Purchases.setLogLevel(LOG_LEVEL.DEBUG);

      if (Platform.OS === 'ios') {
        Purchases.configure({ apiKey: API_KEY_APPLE });
      } else if (Platform.OS === 'android') {
        // Purchases.configure({ apiKey: API_KEY_GOOGLE });
        console.warn('Android API Key not configured yet');
      }
      
      this.isInitialized = true;
      console.log('[SubscriptionService] Successfully configured RevenueCat');
    } catch (e) {
      console.error('[SubscriptionService] Failed to configure RevenueCat:', e);
    }
  }

  async checkProStatus(): Promise<boolean> {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      // Check if the user has the 'premium' (or legacy 'pro') entitlement active
      return typeof customerInfo.entitlements.active['premium'] !== 'undefined' || 
             typeof customerInfo.entitlements.active['pro'] !== 'undefined';
    } catch (e) {
      console.error('[SubscriptionService] Error checking Pro status:', e);
      return false;
    }
  }

  async getOfferings() {
    try {
      console.log('[SubscriptionService] Fetching offering: paywall');
      const offerings = await Purchases.getOfferings();
      
      const paywallOffering = offerings?.all['paywall'];

      if (!paywallOffering?.availablePackages) {
        console.log("[SubscriptionService] No RevenueCat offerings available");
        return [];
      }
      
      console.log('[SubscriptionService] Paywall offering loaded');
      const packages = paywallOffering.availablePackages;
      
      const hasMonthly = packages.some(p => p.packageType === 'MONTHLY' || p.identifier === '$rc_monthly');
      const hasYearly = packages.some(p => p.packageType === 'ANNUAL' || p.identifier === '$rc_annual');
      
      if (hasMonthly) console.log('[SubscriptionService] Monthly package loaded');
      if (hasYearly) console.log('[SubscriptionService] Yearly package loaded');
      
      return packages;
    } catch (e) {
      console.error('[SubscriptionService] Error fetching offerings:', e);
      return [];
    }
  }

  async purchasePackage(pkg: PurchasesPackage): Promise<{ success: boolean; customerInfo?: CustomerInfo; error?: string }> {
    try {
      console.log(`[SubscriptionService] Purchasing package: ${pkg.identifier}`);
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      console.log('[SubscriptionService] Purchase successful');
      
      const isPremium = typeof customerInfo.entitlements.active['premium'] !== 'undefined' || typeof customerInfo.entitlements.active['pro'] !== 'undefined';
      if (isPremium) {
        console.log('[SubscriptionService] Premium entitlement active: true');
      }
      
      return { success: true, customerInfo };
    } catch (e: any) {
      if (!e.userCancelled) {
        console.error('[SubscriptionService] Purchase failed:', e);
        return { success: false, error: e.message };
      }
      return { success: false, error: 'User cancelled' };
    }
  }

  async restorePurchases(): Promise<{ success: boolean; customerInfo?: CustomerInfo; error?: string }> {
    try {
      console.log('[SubscriptionService] Restoring purchases');
      const customerInfo = await Purchases.restorePurchases();
      console.log('[SubscriptionService] Restore successful');
      return { success: true, customerInfo };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }
}

export const subscriptionService = new SubscriptionService();
