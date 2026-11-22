import { ScrollView, Text, StyleSheet, useColorScheme, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radii, UI } from '../constants/theme';
import PortraitContainer from '../components/PortraitContainer';

export default function AboutScreen() {
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
          <Text style={[styles.header, { color: theme.text }]}>Welcome to Wakup</Text>
          <Text style={[styles.paragraph, { color: theme.textMuted }]}>
            Wakup is designed to help you build better morning habits. We believe that waking up doesn't have to be a struggle, and by incorporating simple, engaging challenges into your morning routine, you can start your day with a win.
          </Text>
          <Text style={[styles.paragraph, { color: theme.textMuted }]}>
            Our mission is to make oversleeping a thing of the past. With our unique mini-games, you are forced to wake up your brain before you can turn off the alarm. 
          </Text>
          <Text style={[styles.paragraph, { color: theme.textMuted }]}>
            Built with ❤️ for heavy sleepers everywhere.
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
