import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator, Alert, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radii, UI } from '../constants/theme';
import { subscriptionService } from '../services/subscriptionService';
import { PurchasesPackage } from 'react-native-purchases';

// Mock data in case Apple App Store Connect isn't fully configured yet by the user
const MOCK_PACKAGES: any[] = [
  {
    identifier: '$rc_annual',
    packageType: 'ANNUAL',
    product: {
      identifier: 'wakup_yearly',
      description: 'Annual Pro Subscription',
      title: 'Wakup Pro (1 Year)',
      priceString: '$29.99',
      currencyCode: 'USD',
      price: 29.99,
    },
  },
  {
    identifier: '$rc_monthly',
    packageType: 'MONTHLY',
    product: {
      identifier: 'wakup_monthly',
      description: 'Monthly Pro Subscription',
      title: 'Wakup Pro (1 Month)',
      priceString: '$4.99',
      currencyCode: 'USD',
      price: 4.99,
    },
  },
];

export default function PaywallScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  const [packages, setPackages] = useState<PurchasesPackage[] | any[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);

  useEffect(() => {
    async function loadOfferings() {
      setIsLoading(true);
      const offerings = await subscriptionService.getOfferings();
      if (offerings.length > 0) {
        setPackages(offerings);
        setSelectedPackage(offerings[0].identifier);
      } else {
        // Fallback to mock data if Apple setup isn't finished yet
        console.log('[Paywall] No offerings found, using MOCK data for UI demonstration');
        setPackages(MOCK_PACKAGES);
        setSelectedPackage(MOCK_PACKAGES[0].identifier);
      }
      setIsLoading(false);
    }
    loadOfferings();
  }, []);

  const handlePurchase = async () => {
    if (!selectedPackage) return;
    
    setIsPurchasing(true);
    const pkg = packages.find(p => p.identifier === selectedPackage);
    
    // If it's a mock package, just simulate success
    if (pkg && !pkg.product.subscriptionPeriod) {
      setTimeout(() => {
        setIsPurchasing(false);
        Alert.alert("Success!", "Mock purchase complete. (You are using fake data because Apple Developer isn't linked yet).");
        router.back();
      }, 1500);
      return;
    }

    if (pkg) {
      const { success, error } = await subscriptionService.purchasePackage(pkg as PurchasesPackage);
      setIsPurchasing(false);
      if (success) {
        Alert.alert("Welcome to Pro!", "Thank you for upgrading.");
        router.back();
      } else {
        if (error !== 'User cancelled') {
          Alert.alert("Purchase Failed", error || "Unknown error occurred.");
        }
      }
    }
  };

  const handleRestore = async () => {
    setIsPurchasing(true);
    const { success, error } = await subscriptionService.restorePurchases();
    setIsPurchasing(false);
    
    if (success) {
      Alert.alert("Restored", "Your purchases have been restored.");
    } else {
      Alert.alert("Restore Failed", error || "Could not restore purchases.");
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.closeButton}>
          <Ionicons name="close" size={28} color={theme.textMuted} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.heroSection}>
          <Text style={styles.heroIcon}>💎</Text>
          <Text style={[styles.title, { color: theme.text }]}>Wakup <Text style={{ color: theme.primary }}>Pro</Text></Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>
            Unlock the ultimate wake-up experience and never oversleep again.
          </Text>
        </View>

        <View style={styles.featuresList}>
          {[
            { icon: 'game-controller', text: 'Unlimited access to all mini-games' },
            { icon: 'musical-notes', text: 'Premium alarm sounds & music' },
            { icon: 'stats-chart', text: 'Detailed sleep & wake-up analytics' },
            { icon: 'cloud-done', text: 'Cloud sync across all your devices' }
          ].map((feature, idx) => (
            <View key={idx} style={styles.featureItem}>
              <View style={[styles.featureIconBox, { backgroundColor: theme.primary + '20' }]}>
                <Ionicons name={feature.icon as any} size={20} color={theme.primary} />
              </View>
              <Text style={[styles.featureText, { color: theme.text }]}>{feature.text}</Text>
            </View>
          ))}
        </View>

        <View style={styles.packagesContainer}>
          {packages.map((pkg) => {
            const isSelected = selectedPackage === pkg.identifier;
            return (
              <Pressable
                key={pkg.identifier}
                style={[
                  styles.packageCard,
                  { backgroundColor: theme.surface, borderColor: isSelected ? theme.primary : theme.border },
                  isSelected && styles.packageCardSelected
                ]}
                onPress={() => setSelectedPackage(pkg.identifier)}
              >
                <View style={styles.packageInfo}>
                  <Text style={[styles.packageTitle, { color: theme.text }]}>
                    {pkg.packageType === 'ANNUAL' ? 'Yearly' : 'Monthly'}
                  </Text>
                  {pkg.packageType === 'ANNUAL' && (
                    <View style={[styles.badge, { backgroundColor: theme.primary }]}>
                      <Text style={styles.badgeText}>BEST VALUE</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.packagePrice, { color: theme.text }]}>
                  {pkg.product.priceString}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: theme.background }]}>
        <Pressable 
          style={[styles.purchaseButton, { backgroundColor: theme.primary, opacity: isPurchasing ? 0.7 : 1 }]}
          onPress={handlePurchase}
          disabled={isPurchasing}
        >
          {isPurchasing ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.purchaseButtonText}>Continue</Text>
          )}
        </Pressable>
        <View style={styles.footerLinks}>
          <Pressable onPress={handleRestore}><Text style={[styles.footerLinkText, { color: theme.textMuted }]}>Restore Purchases</Text></Pressable>
          <Text style={{ color: theme.textMuted }}> • </Text>
          <Pressable><Text style={[styles.footerLinkText, { color: theme.textMuted }]}>Terms</Text></Pressable>
          <Text style={{ color: theme.textMuted }}> • </Text>
          <Pressable><Text style={[styles.footerLinkText, { color: theme.textMuted }]}>Privacy</Text></Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: Spacing.lg,
    paddingTop: Spacing.xl, // safe area padding handled by modal usually, but adding a bit extra
  },
  closeButton: {
    padding: Spacing.sm,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: 100,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  heroIcon: {
    fontSize: 64,
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.h1,
    fontSize: 40,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.bodyLarge,
    textAlign: 'center',
    paddingHorizontal: Spacing.md,
    lineHeight: 24,
  },
  featuresList: {
    marginBottom: Spacing.xxl,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  featureIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  featureText: {
    ...Typography.h3,
    flex: 1,
  },
  packagesContainer: {
    gap: Spacing.md,
  },
  packageCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderWidth: 2,
    borderRadius: Radii.lg,
  },
  packageCardSelected: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)', // Subtle primary tint
  },
  packageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  packageTitle: {
    ...Typography.h3,
    fontWeight: '700',
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radii.sm,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900',
  },
  packagePrice: {
    ...Typography.h3,
  },
  footer: {
    padding: Spacing.xl,
    paddingBottom: Spacing.xxl,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  purchaseButton: {
    height: UI.buttonHeight,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  purchaseButtonText: {
    ...Typography.bodyLarge,
    color: '#FFF',
    fontWeight: '800',
  },
  footerLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerLinkText: {
    fontSize: 12,
  },
});
