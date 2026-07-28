import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import { Colors, Typography, Spacing, Radii } from '../../constants/theme';

export default function ProgressScreen() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Your Progress</Text>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>Keep waking up on time.</Text>
      </View>
      
      <View style={styles.content}>
        <View style={[styles.streakCircle, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={styles.streakFlame}>🔥</Text>
          <Text style={[styles.streakNumber, { color: theme.primary }]}>0</Text>
          <Text style={[styles.streakLabel, { color: theme.textMuted }]}>DAYS</Text>
        </View>
        <Text style={[styles.emptyText, { color: theme.textMuted }]}>Wake up to your first alarm to start your streak.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: 80, // Space for status bar + header
  },
  header: {
    marginBottom: Spacing.xxl,
  },
  title: {
    ...Typography.h1,
    fontSize: 36,
  },
  subtitle: {
    ...Typography.bodyLarge,
    marginTop: Spacing.xs,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 100, // Offset for visual center
  },
  streakCircle: {
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  streakFlame: {
    fontSize: 48,
    marginBottom: Spacing.sm,
  },
  streakNumber: {
    fontSize: 72,
    fontWeight: '800',
    lineHeight: 80,
  },
  streakLabel: {
    ...Typography.h3,
    letterSpacing: 2,
    marginTop: Spacing.xs,
  },
  emptyText: {
    ...Typography.bodyLarge,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
    lineHeight: 24,
  }
});
