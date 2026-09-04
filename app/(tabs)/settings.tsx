import { View, Text, StyleSheet, useColorScheme, Pressable, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radii, UI } from '../../constants/theme';
import { storageService } from '../../services/storageService';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { subscriptionService } from '../../services/subscriptionService';
import { useProStatus } from '../../hooks/useProStatus';

export default function SettingsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
  
  const { isPro } = useProStatus();
  const [isRestoring, setIsRestoring] = useState(false);

  const handleRestore = async () => {
    setIsRestoring(true);
    const { success, customerInfo, error } = await subscriptionService.restorePurchases();
    setIsRestoring(false);
    
    if (success) {
      const isPremium = typeof customerInfo?.entitlements.active['Pro'] !== 'undefined';
      if (isPremium) {
        Alert.alert("Restored", "Your purchases have been successfully restored.");
      } else {
        Alert.alert("Restored", "No active premium subscription found.");
      }
    } else {
      Alert.alert("Restore Failed", error || "Could not restore purchases.");
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Settings</Text>
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: Spacing.xxl }}>
        <Pressable 
          style={[styles.proBanner, { backgroundColor: isPro ? theme.primary + '20' : theme.surface, borderColor: isPro ? theme.primary : theme.border }]}
          onPress={() => {
            if (!isPro) {
              // @ts-ignore - Route types may not be generated yet
              router.push('/paywall');
            }
          }}
        >
          <View style={styles.proBannerContent}>
            <Text style={styles.proBannerIcon}>💎</Text>
            <View>
              <Text style={[styles.proBannerTitle, { color: theme.text }]}>Wakup Pro</Text>
              <Text style={[styles.proBannerSubtitle, { color: theme.textMuted }]}>
                {isPro ? 'Active subscription' : 'Upgrade to Pro'}
              </Text>
            </View>
          </View>
          <View style={[styles.proBadge, { backgroundColor: isPro ? theme.primary : theme.surface, borderColor: theme.border, borderWidth: isPro ? 0 : 1 }]}>
            <Text style={[styles.proBadgeText, { color: isPro ? '#FFF' : theme.textMuted }]}>
              {isPro ? '⭐ PRO' : 'FREE'}
            </Text>
          </View>
        </Pressable>

        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Pressable style={styles.row} onPress={() => router.push('/about')}>
            <Text style={[styles.rowText, { color: theme.text }]}>About Us</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
          </Pressable>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <Pressable style={styles.row} onPress={() => router.push('/contact')}>
            <Text style={[styles.rowText, { color: theme.text }]}>Contact Us</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
          </Pressable>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <Pressable style={styles.row} onPress={() => router.push('/privacy')}>
            <Text style={[styles.rowText, { color: theme.text }]}>Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
          </Pressable>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <Pressable style={styles.row} onPress={() => router.push('/terms')}>
            <Text style={[styles.rowText, { color: theme.text }]}>Terms of Service</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
          </Pressable>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <Pressable style={styles.row} onPress={() => router.push('/refund')}>
            <Text style={[styles.rowText, { color: theme.text }]}>Refund Policy</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
          </Pressable>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <Pressable style={styles.row} onPress={handleRestore} disabled={isRestoring}>
            <Text style={[styles.rowText, { color: theme.text }]}>Restore Purchases</Text>
            {isRestoring ? (
              <ActivityIndicator size="small" color={theme.primary} />
            ) : (
              <Ionicons name="refresh" size={20} color={theme.textMuted} />
            )}
          </Pressable>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          
          <Pressable 
            style={styles.row} 
            onPress={async () => {
              Alert.alert(
                "Test Onboarding",
                "This will clear your current onboarding data and start over. Continue?",
                [
                  { text: "Cancel", style: "cancel" },
                  { text: "Yes", onPress: async () => {
                      await storageService.clearOnboarding();
                      router.replace('/onboarding');
                    }
                  }
                ]
              );
            }}
          >
            <Text style={[styles.rowText, { color: theme.text }]}>Test Onboarding</Text>
            <Ionicons name="flask" size={20} color={theme.textMuted} />
          </Pressable>
        </View>

        <Text style={[styles.versionText, { color: theme.textMuted }]}>Wakup v1.0.0</Text>


      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: 80,
  },
  header: {
    marginBottom: Spacing.xxl,
  },
  title: {
    ...Typography.h1,
    fontSize: 36,
  },
  content: {
    flex: 1,
    marginTop: Spacing.xl,
  },
  proBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderRadius: Radii.lg,
    borderWidth: 1,
    marginBottom: Spacing.xl,
  },
  proBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  proBannerIcon: {
    fontSize: 32,
    marginRight: Spacing.md,
  },
  proBannerTitle: {
    ...Typography.h3,
    fontWeight: '800',
  },
  proBannerSubtitle: {
    ...Typography.body,
  },
  proBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radii.sm,
  },
  proBadgeText: {
    fontSize: 10,
    fontWeight: '900',
  },
  card: {
    borderRadius: Radii.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    minHeight: 60,
  },
  rowText: {
    ...Typography.bodyLarge,
  },
  rowValue: {
    ...Typography.body,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    width: '100%',
  },
  versionText: {
    ...Typography.caption,
    textAlign: 'center',
    marginTop: Spacing.xl,
    letterSpacing: 1,
  }
});
