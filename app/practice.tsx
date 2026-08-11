import { View, Text, StyleSheet, Pressable, ScrollView, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radii } from '../constants/theme';
import { GAMES } from '../types/games';
import { useProStatus } from '../hooks/useProStatus';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function PracticeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const { isPro } = useProStatus();

  const handleGameSelect = (gameId: string) => {
    const isPremium = ['mines', 'dragon-tower', 'blackjack', 'lucky-race', 'potion-mix'].includes(gameId);
    /* 
    if (isPremium && !isPro) {
      // @ts-ignore
      router.push('/paywall');
      return;
    }
    */
    
    // @ts-ignore
    router.push({
      pathname: '/alarm/games',
      params: { gameId, isPreview: 'true' }
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={theme.text} />
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]}>Practice Games</Text>
        <View style={{ width: 28 }} />
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: Spacing.xxl }}>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>
          Try out the wake-up challenges without setting an alarm.
        </Text>

        {GAMES.map((game) => {
          const isPremium = ['mines', 'dragon-tower', 'blackjack', 'lucky-race', 'potion-mix'].includes(game.id);
          
          return (
            <Pressable
              key={game.id}
              style={[
                styles.gameCardRow,
                { backgroundColor: theme.surface, borderColor: theme.border }
              ]}
              onPress={() => handleGameSelect(game.id)}
            >
              <Text style={{ fontSize: 32, marginRight: Spacing.md }}>{game.icon}</Text>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                  <Text style={{ ...Typography.h3, color: theme.text }}>{game.title}</Text>
                  {!isPro && isPremium && (
                    <View style={[styles.proBadge, { backgroundColor: theme.primary }]}>
                      <Text style={styles.proBadgeText}>PRO</Text>
                    </View>
                  )}
                </View>
                <Text style={{ ...Typography.body, color: theme.textMuted }}>{game.description}</Text>
              </View>
              <Ionicons name="play-circle" size={28} color={theme.primary} />
            </Pressable>
          );
        })}
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
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
  },
  backButton: {
    padding: Spacing.sm,
  },
  title: {
    ...Typography.h2,
    fontSize: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  subtitle: {
    ...Typography.bodyLarge,
    marginBottom: Spacing.xl,
    marginTop: Spacing.sm,
  },
  gameCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: Radii.lg,
    borderWidth: 1,
    marginBottom: Spacing.md,
    width: '100%',
  },
  proBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radii.sm,
    marginLeft: Spacing.sm,
  },
  proBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFF',
  },
});
