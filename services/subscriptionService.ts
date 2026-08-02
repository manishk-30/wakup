import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL, PurchasesPackage, CustomerInfo } from 'react-native-purchases';

// Your RevenueCat API Key
const API_KEY_APPLE = 'appl_DyRLaIiMtLaexRMbeKJiQpKlzcg';
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
      // Check if the user has the 'pro' entitlement active
      return typeof customerInfo.entitlements.active['pro'] !== 'undefined';
    } catch (e) {
      console.error('[SubscriptionService] Error checking Pro status:', e);
      return false;
    }
  }

  async getOfferings() {
    try {
      const offerings = await Purchases.getOfferings();
      if (offerings.current !== null) {
        return offerings.current.availablePackages;
      }
      return [];
    } catch (e) {
      console.error('[SubscriptionService] Error fetching offerings:', e);
      return [];
    }
  }

  async purchasePackage(pkg: PurchasesPackage): Promise<{ success: boolean; customerInfo?: CustomerInfo; error?: string }> {
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      return { success: true, customerInfo };
    } catch (e: any) {
      if (!e.userCancelled) {
        console.error('[SubscriptionService] Purchase failed:', e);
        return { success: false, error: e.message };
      }
      return { success: false, error: 'User cancelled' };
    }
  }

  async restorePurchases(): Promise<{ success: boolean; error?: string }> {
    try {
      const customerInfo = await Purchases.restorePurchases();
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }
}

export const subscriptionService = new SubscriptionService();
