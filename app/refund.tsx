import { ScrollView, Text, StyleSheet, useColorScheme } from 'react-native';
import { Colors, Typography, Spacing } from '../constants/theme';

export default function RefundScreen() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
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
      <Text style={[styles.paragraph, { color: theme.textMuted, marginBottom: 100 }]}>
        Cancel before the trial ends if you do not want the subscription to renew.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.xl,
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
  platformHeader: {
    ...Typography.h3,
    marginBottom: Spacing.sm,
  },
  bullet: {
    ...Typography.bodyLarge,
    lineHeight: 28,
    marginLeft: Spacing.md,
  }
});
