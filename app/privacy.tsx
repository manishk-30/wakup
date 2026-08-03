import { ScrollView, Text, StyleSheet, useColorScheme } from 'react-native';
import { Colors, Typography, Spacing } from '../constants/theme';

export default function PrivacyScreen() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.header, { color: theme.text }]}>Privacy Policy</Text>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>1. Data that stays on your device</Text>
      <Text style={[styles.paragraph, { color: theme.textMuted }]}>
        The following never leaves your iPhone:
      </Text>
      
      <Text style={[styles.bullet, { color: theme.textMuted }]}>
        <Text style={{ fontWeight: 'bold', color: theme.text }}>• Alarms and wake records. </Text>
        Alarm times, repeat days, chosen missions, sounds, and your wake-up history are stored locally on your device.
      </Text>
      
      <Text style={[styles.bullet, { color: theme.textMuted }]}>
        <Text style={{ fontWeight: 'bold', color: theme.text }}>• Onboarding answers. </Text>
        Your quiz answers (morning-person, age range, wake times, goals, chosen challenge) are used to set up your first alarm and are stored locally.
      </Text>

      <Text style={[styles.sectionTitle, { color: theme.text, marginTop: Spacing.xl }]}>2. Data that leaves your device</Text>
      <Text style={[styles.bullet, { color: theme.textMuted }]}>
        <Text style={{ fontWeight: 'bold', color: theme.text }}>• Purchases (RevenueCat). </Text>
        When you view the paywall or subscribe, Apple processes the payment and RevenueCat, our subscription provider, receives purchase receipts, transaction identifiers, and an anonymous app-generated user ID to manage your entitlement. We never see your payment details.
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
  sectionTitle: {
    ...Typography.h2,
    fontSize: 22,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  paragraph: {
    ...Typography.bodyLarge,
    lineHeight: 28,
    marginBottom: Spacing.md,
  },
  bullet: {
    ...Typography.bodyLarge,
    lineHeight: 28,
    marginLeft: Spacing.md,
    marginBottom: Spacing.sm,
  }
});
