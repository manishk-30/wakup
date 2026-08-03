import { View, Text, StyleSheet, Pressable, ScrollView, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radii } from '../constants/theme';
import { GAMES } from '../types/games';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function PracticeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]}>Practice Games</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xl }}>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>
          Try out any of the challenges below without triggering a real alarm!
        </Text>

        {GAMES.map((game) => (
          <Pressable
            key={game.id}
            style={[
              styles.gameCardRow,
              { 
                backgroundColor: theme.surface,
                borderColor: theme.border,
              }
            ]}
            onPress={() => router.push(`/alarm/games?gameId=${game.id}&isPreview=true`)}
          >
            <Text style={{ fontSize: 32, marginRight: Spacing.md }}>{game.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ ...Typography.h3, color: theme.text }}>{game.title}</Text>
              <Text style={{ ...Typography.body, color: theme.textMuted }}>{game.description}</Text>
            </View>
            <Ionicons name="play-circle" size={28} color={theme.primary} />
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  backButton: {
    marginRight: Spacing.md,
    padding: Spacing.xs,
  },
  title: {
    ...Typography.h2,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
  },
  subtitle: {
    ...Typography.bodyLarge,
    marginBottom: Spacing.xl,
  },
  gameCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: Radii.lg,
    borderWidth: 1,
    marginBottom: Spacing.md,
  }
});
