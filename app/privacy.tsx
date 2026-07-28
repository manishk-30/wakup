import { ScrollView, Text, StyleSheet, useColorScheme } from 'react-native';
import { Colors, Typography, Spacing } from '../constants/theme';

export default function PrivacyScreen() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.header, { color: theme.text }]}>Privacy Policy</Text>
      <Text style={[styles.paragraph, { color: theme.textMuted }]}>
        Your privacy is critically important to us. At Wakup, we have a few fundamental principles:
      </Text>
      <Text style={[styles.bullet, { color: theme.textMuted }]}>
        • We don't ask you for personal information unless we truly need it.
      </Text>
      <Text style={[styles.bullet, { color: theme.textMuted }]}>
        • All your alarms and schedules are stored locally on your device. We do not upload your sleep schedule to our servers.
      </Text>
      <Text style={[styles.bullet, { color: theme.textMuted }]}>
        • We don't share your personal information with anyone except to comply with the law, develop our products, or protect our rights.
      </Text>
      <Text style={[styles.paragraph, { color: theme.textMuted, marginTop: Spacing.lg }]}>
        If you have any questions about accessing or correcting your personal data, please contact our support team.
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
    marginBottom: Spacing.md,
  },
  bullet: {
    ...Typography.bodyLarge,
    lineHeight: 28,
    marginLeft: Spacing.md,
    marginBottom: Spacing.sm,
  }
});
