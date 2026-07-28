import { ScrollView, Text, StyleSheet, useColorScheme } from 'react-native';
import { Colors, Typography, Spacing } from '../constants/theme';

export default function AboutScreen() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
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
});
