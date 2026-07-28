import { ScrollView, Text, StyleSheet, useColorScheme } from 'react-native';
import { Colors, Typography, Spacing } from '../constants/theme';

export default function TermsScreen() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.header, { color: theme.text }]}>Terms of Service</Text>
      <Text style={[styles.paragraph, { color: theme.textMuted }]}>
        By downloading or using the app, these terms will automatically apply to you – you should make sure therefore that you read them carefully before using the app.
      </Text>
      <Text style={[styles.paragraph, { color: theme.textMuted }]}>
        You’re not allowed to copy, or modify the app, any part of the app, or our trademarks in any way. You’re not allowed to attempt to extract the source code of the app, and you also shouldn’t try to translate the app into other languages, or make derivative versions.
      </Text>
      <Text style={[styles.paragraph, { color: theme.textMuted }]}>
        Wakup is committed to ensuring that the app is as useful and efficient as possible. For that reason, we reserve the right to make changes to the app or to charge for its services, at any time and for any reason.
      </Text>

      <Text style={[styles.subHeader, { color: theme.text }]}>Requirements for Use</Text>
      <Text style={[styles.paragraph, { color: theme.textMuted }]}>
        To use Wakup effectively, you must agree to and meet the following requirements:
      </Text>
      <Text style={[styles.bullet, { color: theme.textMuted }]}>• You must be at least 13 years of age to use this app.</Text>
      <Text style={[styles.bullet, { color: theme.textMuted }]}>• You must grant the app permission to send critical alerts, push notifications, and play sounds, otherwise the alarms will not function.</Text>
      <Text style={[styles.bullet, { color: theme.textMuted }]}>• You are responsible for keeping your device charged, turned on, and with the volume up overnight for alarms to trigger reliably.</Text>
      <Text style={[styles.bullet, { color: theme.textMuted }]}>• You agree not to attempt to bypass the alarm mini-games using exploits, force-quitting the app, or unauthorized device modifications.</Text>
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
  bullet: {
    ...Typography.bodyLarge,
    lineHeight: 28,
    marginLeft: Spacing.md,
    marginBottom: Spacing.sm,
  }
});
