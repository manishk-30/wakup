import { ScrollView, Text, StyleSheet, useColorScheme, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radii, UI } from '../constants/theme';
import PortraitContainer from '../components/PortraitContainer';

export default function RefundScreen() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const router = useRouter();

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <PortraitContainer>
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
          <Text style={[styles.header, { color: theme.text }]}>Refund Policy</Text>
          <Text style={[styles.paragraph, { color: theme.textMuted }]}>
            Simple and transparent.
          </Text>

          <Text style={[styles.subHeader, { color: theme.text }]}>Free Trial</Text>
          <Text style={[styles.paragraph, { color: theme.textMuted }]}>
            Wakup may offer a 3-day free trial for eligible users.
          </Text>
          <Text style={[styles.paragraph, { color: theme.textMuted }]}>
            During the trial, you can cancel before the trial ends to avoid being charged.
          </Text>

          <Text style={[styles.subHeader, { color: theme.text }]}>After the Trial</Text>
          <Text style={[styles.paragraph, { color: theme.textMuted }]}>
            If the subscription is not cancelled before the free trial ends, the selected subscription price is charged through Apple's App Store.
          </Text>

          <Text style={[styles.subHeader, { color: theme.text }]}>Refund Requests</Text>
          <Text style={[styles.paragraph, { color: theme.textMuted }]}>
            Wakup's intended refund policy is:
          </Text>
          <Text style={[styles.bullet, { color: theme.textMuted }]}>
            • Refund requests made during the 3-day free-trial period are eligible for cancellation without being charged.
          </Text>
          <Text style={[styles.bullet, { color: theme.textMuted }]}>
            • After a subscription has been charged, refunds are handled through Apple's App Store refund process and are subject to Apple's policies.
          </Text>
          <Text style={[styles.bullet, { color: theme.textMuted }]}>
            • Wakup does not directly process or store users' payment information.
          </Text>

          <Text style={[styles.subHeader, { color: theme.text }]}>How to Cancel Subscription</Text>
          <Text style={[styles.paragraph, { color: theme.textMuted }]}>
            Settings → Apple Account → Subscriptions → Wakup → Cancel Subscription
          </Text>
          <Text style={[styles.paragraph, { color: theme.textMuted }]}>
            Cancel before the trial ends if you do not want the subscription to renew.
          </Text>

          <Pressable
            style={[styles.backButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={handleBack}
          >
            <Ionicons name="arrow-back" size={20} color={theme.text} />
            <Text style={[styles.backButtonText, { color: theme.text }]}>Back to Previous Screen</Text>
          </Pressable>
        </ScrollView>
      </PortraitContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.xl,
    paddingBottom: Spacing.xxl * 2,
  },
  header: {
    ...Typography.h1,
    fontSize: 28,
    marginBottom: Spacing.lg,
    marginTop: Spacing.md,
  },
  paragraph: {
    ...Typography.bodyLarge,
    lineHeight: 28,
    marginBottom: Spacing.lg,
  },
  subHeader: {
    ...Typography.h2,
    fontSize: 22,
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
  bullet: {
    ...Typography.bodyLarge,
    lineHeight: 28,
    marginLeft: Spacing.md,
    marginBottom: Spacing.sm,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: UI.buttonHeight,
    borderRadius: Radii.md,
    borderWidth: 1,
    marginTop: Spacing.xl,
    marginBottom: Spacing.xxl,
    gap: Spacing.sm,
  },
  backButtonText: {
    ...Typography.bodyLarge,
    fontWeight: '700',
  },
});
