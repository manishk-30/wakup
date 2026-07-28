import { ScrollView, Text, StyleSheet, useColorScheme } from 'react-native';
import { Colors, Typography, Spacing } from '../constants/theme';

export default function RefundScreen() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.header, { color: theme.text }]}>Refund Policy</Text>
      <Text style={[styles.paragraph, { color: theme.textMuted }]}>
        Because Wakup is distributed through the Apple App Store and Google Play Store, all purchases, subscriptions, and refunds are handled directly by Apple and Google.
      </Text>
      <Text style={[styles.paragraph, { color: theme.text }]}>
        Please note: Refunds will only be applicable if requested within the 3-day free trial period.
      </Text>
      <Text style={[styles.paragraph, { color: theme.textMuted }]}>
        If you are unsatisfied with a premium purchase or subscription, you must request a refund through your respective app store account settings. We do not have the ability to manually process refunds or manage your billing information.
      </Text>
      <Text style={[styles.paragraph, { color: theme.textMuted }]}>
        Please refer to Apple or Google's official support documentation for instructions on how to request a refund for digital goods.
      </Text>

      <Text style={[styles.subHeader, { color: theme.text }]}>How to Cancel Your Subscription</Text>
      
      <Text style={[styles.platformHeader, { color: theme.text }]}>For iOS (Apple):</Text>
      <Text style={[styles.bullet, { color: theme.textMuted }]}>1. Open the Settings app on your iPhone.</Text>
      <Text style={[styles.bullet, { color: theme.textMuted }]}>2. Tap your name at the top.</Text>
      <Text style={[styles.bullet, { color: theme.textMuted }]}>3. Tap Subscriptions.</Text>
      <Text style={[styles.bullet, { color: theme.textMuted }]}>4. Select Wakup and tap Cancel Subscription.</Text>

      <Text style={[styles.platformHeader, { color: theme.text, marginTop: Spacing.md }]}>For Android (Google Play):</Text>
      <Text style={[styles.bullet, { color: theme.textMuted }]}>1. Open the Google Play Store app.</Text>
      <Text style={[styles.bullet, { color: theme.textMuted }]}>2. Tap your profile icon at the top right.</Text>
      <Text style={[styles.bullet, { color: theme.textMuted }]}>3. Tap Payments & subscriptions, then Subscriptions.</Text>
      <Text style={[styles.bullet, { color: theme.textMuted }]}>4. Select Wakup and tap Cancel subscription.</Text>
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
