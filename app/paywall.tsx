import React, { useEffect, useState, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Animated, Easing, Dimensions, ActivityIndicator, Alert, NativeSyntheticEvent, NativeScrollEvent, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { subscriptionService } from '../services/subscriptionService';
import { PurchasesPackage } from 'react-native-purchases';
import { useProStatus } from '../hooks/useProStatus';

import { useColorScheme } from 'react-native';
import { Colors, Spacing, Radii } from '../constants/theme';

const { width, height } = Dimensions.get('window');

const MOCK_PACKAGES: any[] = [
  {
    isMock: true,
    identifier: '$rc_annual',
    packageType: 'ANNUAL',
    product: {
      identifier: 'wakup_yearly',
      priceString: '₹2499',
    },
  },
  {
    isMock: true,
    identifier: '$rc_monthly',
    packageType: 'MONTHLY',
    product: {
      identifier: 'wakup_monthly',
      priceString: '₹499',
    },
  },
];

export default function PaywallScreen() {
  const colorScheme = useColorScheme();
  const themeColors = colorScheme === 'dark' ? Colors.dark : Colors.light;
  
  const Theme = {
    background: themeColors.background,
    primary: themeColors.primary,
    secondary: themeColors.primaryMuted,
    navy: themeColors.text,
    gray: themeColors.surface,
    radius: Radii.xl,
    padding: Spacing.xl,
  };

  const router = useRouter();
  const { isPro } = useProStatus();
  const styles = useMemo(() => createStyles(Theme), [Theme]);

  const [packages, setPackages] = useState<PurchasesPackage[] | any[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<string>('$rc_annual');
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const scrollViewRef = useRef<ScrollView>(null);

  // Animations
  const floatAnim = useRef(new Animated.Value(0)).current;
  const ctaScale = useRef(new Animated.Value(1)).current;
  const yearCardScale = useRef(new Animated.Value(1)).current;
  const monthCardScale = useRef(new Animated.Value(1)).current;

  // Initial Data Load
  useEffect(() => {
    async function loadOfferings() {
      setIsLoading(true);
      const offerings = await subscriptionService.getOfferings();
      if (offerings.length > 0) {
        setPackages(offerings);
        // Default to annual
        const annual = offerings.find((p: any) => p.packageType === 'ANNUAL');
        if (annual) setSelectedPackage(annual.identifier);
      } else {
        setPackages(MOCK_PACKAGES);
      }
      setIsLoading(false);
    }
    loadOfferings();

    // Floating Mascot Animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true })
      ])
    ).start();
  }, []);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const step = Math.round(offsetX / width);
    if (step !== currentStep) {
      setCurrentStep(step);
      Haptics.selectionAsync();
    }
  };

  const handleNextStep = () => {
    if (currentStep < 2) {
      scrollViewRef.current?.scrollTo({ x: (currentStep + 1) * width, animated: true });
    }
  };

  const handleSelectPackage = (pkgIdentifier: string, type: 'year' | 'month') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedPackage(pkgIdentifier);
    const targetScale = type === 'year' ? yearCardScale : monthCardScale;
    
    Animated.sequence([
      Animated.spring(targetScale, { toValue: 1.03, useNativeDriver: true, speed: 20 }),
      Animated.spring(targetScale, { toValue: 1, useNativeDriver: true, speed: 20 })
    ]).start();
  };

  const handlePurchase = async () => {
    if (!selectedPackage) return;
    
    setIsPurchasing(true);
    const pkg = packages.find(p => p.identifier === selectedPackage);
    
    if (pkg && (pkg as any).isMock) {
      setTimeout(() => {
        setIsPurchasing(false);
        Alert.alert("Success!", "Mock purchase complete.");
        router.back();
      }, 1500);
      return;
    }

    if (pkg) {
      const { success, customerInfo, error } = await subscriptionService.purchasePackage(pkg as PurchasesPackage);
      setIsPurchasing(false);
      if (success) {
        const isPremium = typeof customerInfo?.entitlements.active['Pro'] !== 'undefined';
        if (isPremium) {
          router.replace('/');
        } else {
          Alert.alert("Purchase Complete", "But the premium entitlement was not unlocked.");
        }
      } else {
        if (error !== 'User cancelled') {
          Alert.alert("Purchase Failed", error || "Unknown error occurred.");
        }
      }
    }
  };

  const handleRestore = async () => {
    setIsPurchasing(true);
    const { success, customerInfo, error } = await subscriptionService.restorePurchases();
    setIsPurchasing(false);
    
    if (success) {
      const isPremium = typeof customerInfo?.entitlements.active['Pro'] !== 'undefined';
      if (isPremium) {
        Alert.alert("Restored", "Your purchases have been restored.");
        router.replace('/');
      } else {
        Alert.alert("Restored", "No active premium subscription found.");
      }
    } else {
      Alert.alert("Restore Failed", error || "Could not restore purchases.");
    }
  };

  const animateCTAPressIn = () => {
    Animated.spring(ctaScale, { toValue: 0.97, useNativeDriver: true, speed: 20 }).start();
  };

  const animateCTAPressOut = () => {
    Animated.spring(ctaScale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 10 }).start();
  };

  const mascotTransform = { transform: [{ translateY: floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -10] }) }] };

  const getPrice = (type: 'ANNUAL' | 'MONTHLY') => {
    const pkg = packages.find(p => p.packageType === type || p.identifier.includes(type.toLowerCase()));
    if (pkg) {
      return pkg.product.priceString;
    }
    return type === 'ANNUAL' ? '₹2499' : '₹499';
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={Theme.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Pressable onPress={() => {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/');
        }
      }} style={styles.closeBtn}>
        <Ionicons name="close" size={28} color={Theme.navy} />
      </Pressable>

      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        bounces={false}
      >
        {/* SCREEN 1 */}
        <View style={styles.screen}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
            <View style={styles.header}>
              <Text style={styles.headline}>Wake up feeling in control.</Text>
              <Text style={styles.subtitle}>Tomorrow's version of you starts with one better morning.</Text>
            </View>

            <View style={styles.illustrationArea}>
              <Animated.View style={mascotTransform}>
                <Image source={require('../assets/images/mascot_happy.png')} style={styles.mascotImage} contentFit="contain" />
              </Animated.View>
            </View>

            <View style={styles.contentArea}>
              <View style={styles.benefitCard}>
                <Text style={styles.benefitIcon}>☀️</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.benefitTitle}>Beat the Snooze Button</Text>
                  <Text style={styles.benefitDesc}>Wake up by completing fun challenges.</Text>
                </View>
              </View>
              <View style={styles.benefitCard}>
                <Text style={styles.benefitIcon}>🎯</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.benefitTitle}>Stay Consistent</Text>
                  <Text style={styles.benefitDesc}>Build a routine you'll actually enjoy.</Text>
                </View>
              </View>
              <View style={styles.benefitCard}>
                <Text style={styles.benefitIcon}>🌅</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.benefitTitle}>Start Every Morning Better</Text>
                  <Text style={styles.benefitDesc}>Small improvements every single day.</Text>
                </View>
              </View>
            </View>
          </ScrollView>
        </View>

        {/* SCREEN 2 */}
        <View style={styles.screen}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
            <View style={styles.header}>
              <Text style={styles.headline}>Everything you need for better mornings.</Text>
            </View>

            <View style={styles.illustrationArea}>
              <Animated.View style={mascotTransform}>
                <Image source={require('../assets/images/mascot_confident.png')} style={styles.mascotImage} contentFit="contain" />
              </Animated.View>
            </View>

            <View style={styles.contentArea}>
              <View style={[styles.premiumCard, { marginBottom: 16 }]}>
                <Text style={styles.premiumCardTitle}>☀️ Unlimited Smart Alarms</Text>
                <Text style={styles.premiumCardDesc}>Never miss an important morning.</Text>
              </View>
              <View style={[styles.premiumCard, { marginBottom: 16 }]}>
                <Text style={styles.premiumCardTitle}>🎮 All Wake-up Games</Text>
                <Text style={styles.premiumCardDesc}>Blackjack, Dragon Tower, Dice, Roulette, Higher/Lower, Mines. All future games included.</Text>
              </View>
              
              <View style={styles.ratingCard}>
                <Text style={styles.stars}>★★★★★</Text>
                <Text style={styles.ratingTitle}>4.9 Rating</Text>
                <Text style={styles.ratingDesc}>Thousands of mornings improved.</Text>
              </View>
            </View>
          </ScrollView>
        </View>

        {/* SCREEN 3 */}
        <View style={styles.screen}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
            <View style={styles.header}>
              <Text style={styles.headline}>Start your 3-day free trial.</Text>
              <Text style={styles.subtitle}>Wake up better. Cancel anytime.</Text>
            </View>

            <View style={[styles.illustrationArea, { height: 160 }]}>
              <Animated.View style={mascotTransform}>
                <Image source={require('../assets/images/mascot_peace.png')} style={styles.mascotImage} contentFit="contain" />
              </Animated.View>
            </View>

            <View style={styles.contentArea}>
              {isPro ? (
                <View style={[styles.premiumCard, { alignItems: 'center', paddingVertical: 40 }]}>
                  <Text style={{ fontSize: 40, marginBottom: 16 }}>⭐</Text>
                  <Text style={[styles.premiumCardTitle, { textAlign: 'center' }]}>You're already a Wakup Pro member.</Text>
                  <Text style={[styles.premiumCardDesc, { textAlign: 'center', marginTop: 8 }]}>Enjoy every morning.</Text>
                </View>
              ) : (
                <>
                  <View style={styles.timeline}>
                    <View style={styles.timelineRow}>
                      <Text style={styles.timelineIcon}>☀️</Text>
                      <View style={styles.timelineContent}>
                        <Text style={styles.timelineTitle}>TODAY</Text>
                        <Text style={styles.timelineDesc}>Unlock every Pro feature</Text>
                      </View>
                    </View>
                    <View style={styles.timelineLine} />
                    <View style={styles.timelineRow}>
                      <Text style={styles.timelineIcon}>🔔</Text>
                      <View style={styles.timelineContent}>
                        <Text style={styles.timelineTitle}>2 DAYS</Text>
                        <Text style={styles.timelineDesc}>We'll remind you before your trial ends.</Text>
                      </View>
                    </View>
                    <View style={styles.timelineLine} />
                    <View style={styles.timelineRow}>
                      <Text style={styles.timelineIcon}>💛</Text>
                      <View style={styles.timelineContent}>
                        <Text style={styles.timelineTitle}>DAY 3</Text>
                        <Text style={styles.timelineDesc}>Continue with Pro or cancel anytime.</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.pricingContainer}>
                    {packages.map(pkg => {
                      const isYear = pkg.packageType === 'ANNUAL';
                      const isSelected = selectedPackage === pkg.identifier;
                      const scaleAnim = isYear ? yearCardScale : monthCardScale;
                      
                      return (
                        <Animated.View key={pkg.identifier} style={{ transform: [{ scale: scaleAnim }], width: '48%' }}>
                          <Pressable 
                            style={[styles.pricingCard, isSelected && styles.pricingCardSelected]}
                            onPress={() => handleSelectPackage(pkg.identifier, isYear ? 'year' : 'month')}
                          >
                            {isYear && <View style={styles.bestValueBadge}><Text style={styles.badgeText}>🔥 BEST VALUE</Text></View>}
                            {isSelected && <View style={styles.checkIcon}><Ionicons name="checkmark-circle" size={24} color={Theme.primary} /></View>}
                            
                            <Text style={styles.planName}>{isYear ? 'Yearly' : 'Monthly'}</Text>
                            <Text style={styles.planPrice}>{pkg.product.priceString}/{isYear ? 'year' : 'month'}</Text>
                            {isYear && <Text style={styles.planSavings}>Save over 70%</Text>}
                          </Pressable>
                        </Animated.View>
                      );
                    })}
                  </View>
                </>
              )}
            </View>
          </ScrollView>
        </View>
      </ScrollView>

      {/* FOOTER & CTA */}
      <View style={styles.footerArea}>

        <Pressable 
          onPressIn={animateCTAPressIn}
          onPressOut={animateCTAPressOut}
          onPress={currentStep === 2 || isPro ? handlePurchase : handleNextStep}
          disabled={isPurchasing}
        >
          <Animated.View style={[styles.ctaButton, { transform: [{ scale: ctaScale }], opacity: isPurchasing ? 0.7 : 1 }]}>
            {isPurchasing ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.ctaText}>
                {isPro ? "Continue" : (currentStep === 2 ? "🌅 Start My Free Trial" : "Continue →")}
              </Text>
            )}
          </Animated.View>
        </Pressable>

        {currentStep === 2 && !isPro && (
          <Text style={styles.trialInfoText}>3 days free, then {getPrice('ANNUAL')}/year</Text>
        )}

        {currentStep === 2 && (
          <View style={styles.footerLinksRow}>
            <Pressable onPress={handleRestore}><Text style={styles.footerLink}>Restore Purchases</Text></Pressable>
            <Text style={styles.footerLinkDot}> • </Text>
            <Pressable onPress={() => router.push('/privacy')}><Text style={styles.footerLink}>Privacy Policy</Text></Pressable>
            <Text style={styles.footerLinkDot}> • </Text>
            <Pressable onPress={() => router.push('/terms')}><Text style={styles.footerLink}>Terms</Text></Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

const createStyles = (Theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.background,
  },
  closeBtn: {
    position: 'absolute',
    top: 60,
    right: 24,
    zIndex: 10,
    padding: 8,
  },
  screen: {
    width: width,
    flex: 1,
    paddingHorizontal: Theme.padding,
    paddingTop: 80,
  },
  header: {
    marginBottom: 24,
  },
  tag: {
    backgroundColor: Theme.gray,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '800',
    color: Theme.navy,
    letterSpacing: 1,
  },
  headline: {
    fontSize: 34,
    fontWeight: '800',
    color: Theme.navy,
    lineHeight: 40,
    fontFamily: 'System',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
  },
  illustrationArea: {
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  mascotImage: {
    width: 200,
    height: 200,
  },
  contentArea: {
    flex: 1,
  },
  benefitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.gray,
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
  },
  benefitIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Theme.navy,
    marginBottom: 4,
  },
  benefitDesc: {
    fontSize: 14,
    color: '#6B7280',
  },
  premiumCard: {
    backgroundColor: Theme.background,
    padding: 20,
    borderRadius: 20,
    shadowColor: Theme.navy,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 3,
    borderWidth: 1,
    borderColor: Theme.gray,
  },
  premiumCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Theme.navy,
    marginBottom: 6,
  },
  premiumCardDesc: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  ratingCard: {
    backgroundColor: 'rgba(255, 176, 0, 0.05)',
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 176, 0, 0.1)',
  },
  stars: {
    fontSize: 20,
    color: Theme.primary,
    marginBottom: 8,
    letterSpacing: 2,
  },
  ratingTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Theme.navy,
  },
  ratingDesc: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  timeline: {
    marginBottom: 24,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  timelineIcon: {
    fontSize: 20,
    marginRight: 16,
    marginTop: 2,
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Theme.navy,
    marginBottom: 4,
  },
  timelineDesc: {
    fontSize: 14,
    color: '#6B7280',
  },
  timelineLine: {
    width: 2,
    height: 24,
    backgroundColor: Theme.gray,
    marginLeft: 11,
    marginVertical: 4,
  },
  pricingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pricingCard: {
    backgroundColor: Theme.gray,
    padding: 16,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    position: 'relative',
    height: 140,
    justifyContent: 'center',
  },
  pricingCardSelected: {
    backgroundColor: '#FFF8E6',
    borderColor: Theme.primary,
    shadowColor: Theme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  bestValueBadge: {
    position: 'absolute',
    top: -12,
    backgroundColor: '#FF3B30',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900',
  },
  checkIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  planName: {
    fontSize: 16,
    fontWeight: '700',
    color: Theme.navy,
    marginBottom: 8,
  },
  planPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: Theme.navy,
  },
  planSavings: {
    fontSize: 12,
    color: Theme.primary,
    fontWeight: '600',
    marginTop: 8,
  },
  footerArea: {
    paddingHorizontal: Theme.padding,
    paddingBottom: 40,
    backgroundColor: Theme.background,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Theme.gray,
    marginRight: 6,
  },
  progressDotActive: {
    width: 24,
    backgroundColor: Theme.primary,
  },
  progressText: {
    marginLeft: 'auto',
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
  },
  ctaButton: {
    backgroundColor: Theme.primary,
    height: 56,
    borderRadius: Theme.radius,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Theme.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 5,
  },
  ctaText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFF',
  },
  trialInfoText: {
    textAlign: 'center',
    fontSize: 13,
    color: '#6B7280',
    marginTop: 16,
  },
  footerLinksRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerLink: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  footerLinkDot: {
    fontSize: 12,
    color: '#9CA3AF',
    marginHorizontal: 8,
  }
});
