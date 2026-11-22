import { ScrollView, Text, StyleSheet, useColorScheme, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radii, UI } from '../constants/theme';
import PortraitContainer from '../components/PortraitContainer';

export default function TermsScreen() {
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
          <Text style={[styles.header, { color: theme.text }]}>Terms of Service</Text>
          <Text style={[styles.paragraph, { color: theme.textMuted }]}>
            By downloading or using Wakup, you agree to these Terms of Service.
          </Text>

          <Text style={[styles.subHeader, { color: theme.text }]}>1. Intellectual Property</Text>
          <Text style={[styles.paragraph, { color: theme.textMuted }]}>
            Wakup's Name, Logo, Sun mascot, Illustrations, Game designs, UI, Software, Content, and Trademarks are protected intellectual property.
          </Text>
          <Text style={[styles.paragraph, { color: theme.textMuted }]}>
            Users may not copy, modify, reverse engineer, extract, redistribute, or create derivative versions of Wakup.
          </Text>

          <Text style={[styles.subHeader, { color: theme.text }]}>2. Requirements for Use</Text>
          <Text style={[styles.paragraph, { color: theme.textMuted }]}>
            To use Wakup effectively:
          </Text>
          <Text style={[styles.bullet, { color: theme.textMuted }]}>• You must meet the minimum age requirement.</Text>
          <Text style={[styles.bullet, { color: theme.textMuted }]}>• You should grant the permissions required for alarms and notifications.</Text>
          <Text style={[styles.bullet, { color: theme.textMuted }]}>• You should keep your device charged and powered on.</Text>
          <Text style={[styles.bullet, { color: theme.textMuted }]}>• You should keep required notification/sound settings enabled.</Text>
          <Text style={[styles.bullet, { color: theme.textMuted }]}>• You should not intentionally attempt to bypass the app's wake-up challenges through exploits or unauthorized device modifications.</Text>

          <Text style={[styles.subHeader, { color: theme.text }]}>3. Wake-Up Games</Text>
          <Text style={[styles.paragraph, { color: theme.textMuted }]}>
            Wakup's games are designed solely as interactive wake-up challenges.
          </Text>

          <Text style={[styles.subHeader, { color: theme.text }]}>4. Alarm Disclaimer</Text>
          <Text style={[styles.paragraph, { color: theme.textMuted }]}>
            Wakup is designed to provide alarm functionality, but no software can guarantee an alarm will function under every circumstance.
          </Text>
          <Text style={[styles.paragraph, { color: theme.textMuted }]}>
            Potential causes for failure include: Device being powered off, battery depletion, system restrictions, disabled permissions, user settings, hardware issues, or iOS behavior.
          </Text>
          <Text style={[styles.paragraph, { color: theme.textMuted }]}>
            Users should take appropriate precautions when an alarm is important.
          </Text>

          <Text style={[styles.subHeader, { color: theme.text }]}>5. Subscriptions</Text>
          <Text style={[styles.paragraph, { color: theme.textMuted }]}>
            Wakup Pro subscriptions are purchased through Apple's App Store. Subscriptions may automatically renew according to the selected plan unless cancelled before renewal. Apple's terms and billing policies apply to App Store transactions.
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
