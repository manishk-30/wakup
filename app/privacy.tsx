import { ScrollView, Text, StyleSheet, useColorScheme } from 'react-native';
import { Colors, Typography, Spacing } from '../constants/theme';

export default function PrivacyScreen() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.header, { color: theme.text }]}>Privacy Policy</Text>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>1. Data That Stays on Your Device</Text>
      
      <Text style={[styles.bullet, { color: theme.textMuted }]}>
        <Text style={{ fontWeight: 'bold', color: theme.text }}>Alarms and wake records: </Text>
        Alarm times, repeat days, selected challenges, alarm sounds, wake-up history, and related app settings are stored locally on your iPhone.
      </Text>
      
      <Text style={[styles.bullet, { color: theme.textMuted }]}>
        <Text style={{ fontWeight: 'bold', color: theme.text }}>Onboarding answers: </Text>
        Information you provide during onboarding, such as your wake-up preferences, goals, age range, preferred challenge and routine settings, is used to configure your Wakup experience and stored locally where applicable.
      </Text>

      <Text style={[styles.bullet, { color: theme.textMuted }]}>
        <Text style={{ fontWeight: 'bold', color: theme.text }}>Commitment signature: </Text>
        If Wakup includes a commitment signature during onboarding, the signature is stored locally on your device unless the app later explicitly states otherwise.
      </Text>

      <Text style={[styles.sectionTitle, { color: theme.text, marginTop: Spacing.xl }]}>2. Data That Leaves Your Device</Text>
      <Text style={[styles.bullet, { color: theme.textMuted }]}>
        <Text style={{ fontWeight: 'bold', color: theme.text }}>Purchases: </Text>
        When you purchase or subscribe to Wakup Pro, Apple processes the payment through Apple's in-app purchase system.
      </Text>
      <Text style={[styles.paragraph, { color: theme.textMuted }]}>
        Wakup does not receive or store:{'\n'}
        • Credit card numbers{'\n'}
        • Debit card numbers{'\n'}
        • UPI credentials{'\n'}
        • Apple Pay credentials{'\n\n'}
        Only information necessary to determine subscription entitlement may be available to the app or any subscription-management provider actually integrated into the app.
      </Text>

      <Text style={[styles.sectionTitle, { color: theme.text, marginTop: Spacing.xl }]}>3. Notifications</Text>
      <Text style={[styles.paragraph, { color: theme.textMuted }]}>
        Wakup may request notification permission to deliver alarms and related notifications. Users are responsible for keeping their iPhone:{'\n'}
        • Charged{'\n'}
        • Powered on{'\n'}
        • Configured with the necessary permissions{'\n\n'}
        Alarm reliability can also be affected by iOS behavior, device settings, Focus modes, notification settings, or other system conditions.
      </Text>

      <Text style={[styles.sectionTitle, { color: theme.text, marginTop: Spacing.xl }]}>4. Motion / Microphone / Other Sensors</Text>
      <Text style={[styles.paragraph, { color: theme.textMuted }]}>
        If a specific Wakup game requires device motion, microphone input, or another sensor:{'\n'}
        • We request the relevant iOS permission only when necessary.{'\n'}
        • Explain why the permission is required.{'\n'}
        • We do not collect or transmit sensor data unnecessarily.{'\n'}
        • We process sensor input locally whenever possible.
      </Text>

      <Text style={[styles.sectionTitle, { color: theme.text, marginTop: Spacing.xl }]}>5. Children</Text>
      <Text style={[styles.paragraph, { color: theme.textMuted }]}>
        Wakup is intended for users 13 years of age or older, unless the final App Store configuration states a different age requirement.
      </Text>

      <Text style={[styles.sectionTitle, { color: theme.text, marginTop: Spacing.xl }]}>6. Data Deletion</Text>
      <Text style={[styles.paragraph, { color: theme.textMuted }]}>
        Because core app information is stored locally, users can remove local Wakup data by deleting the app, subject to any iOS backup behavior.
      </Text>

      <Text style={[styles.sectionTitle, { color: theme.text, marginTop: Spacing.xl }]}>7. Changes to Privacy Policy</Text>
      <Text style={[styles.paragraph, { color: theme.textMuted, marginBottom: 100 }]}>
        Wakup may update this Privacy Policy when the app's functionality or legal requirements change.
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
