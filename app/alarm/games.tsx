import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, Typography, Spacing, Radii, UI } from '../../constants/theme';
import { alarmService } from '../../services/alarmService';
import { storageService } from '../../services/storageService';
import { GameSession } from '../../types/games';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ALARM_SOUNDS } from '../../constants/sounds';

// Import Games
import BlackjackGame from '../../games/blackjack/BlackjackGame';
import DragonTowerGame from '../../games/dragon-tower/DragonTowerGame';
import RouletteGame from '../../games/roulette/RouletteGame';
import DiceGame from '../../games/dice/DiceGame';
import HigherLowerGame from '../../games/higher-lower/HigherLowerGame';
import MinesGame from '../../games/mines/MinesGame';
import CoinFlipGame from '../../games/coin-flip/CoinFlipGame';
import CardGuessGame from '../../games/card-guess/CardGuessGame';

export default function GameScreen() {
  const { gameId, alarmId, isPreview } = useLocalSearchParams();
  const router = useRouter();
  
  const [gameState, setGameState] = useState<'PLAYING' | 'WON' | 'LOST'>('PLAYING');
  const [session, setSession] = useState<GameSession | null>(null);

  useEffect(() => {
    // Generate a unique session ID every time a game starts
    setSession({
      id: Date.now().toString(),
      gameId: gameId as string,
      alarmId: (alarmId as string) || 'current',
      startedAt: Date.now(),
    });

    if (isPreview === 'true') {
      const playPreviewSound = async () => {
        await alarmService.configureAudioSession();
        await alarmService.playForegroundAlarm(ALARM_SOUNDS[0].file);
      };
      playPreviewSound();

      return () => {
        alarmService.stopForegroundAlarm();
      };
    }
  }, [gameId, isPreview]);

  const handleWin = async () => {
    if (session) {
      session.result = 'win';
      // Analytics/logging could happen here
    }
    if (isPreview === 'true') {
      alarmService.stopForegroundAlarm();
      router.back();
      return;
    }
    
    console.log(`[Challenge] Challenge completed successfully for alarm: ${alarmId || 'current'}`);
    
    // Add streak for today
    const todayStr = new Date().toISOString().split('T')[0];
    await storageService.addStreakDay(todayStr);

    await alarmService.stopAlarm((alarmId as string) || 'current');
    
    console.log('[Navigation] Returning to Home after challenge completion');
    router.replace('/');
  };

  const handleLose = () => {
    if (session) {
      session.result = 'loss';
    }
    // Auto-restart game instantly without showing the intermediate generic loss screen
    restartGame();
  };

  const renderGame = () => {
    const props = { onWin: handleWin, onLose: handleLose };
    const sessionKey = session?.id;
    switch (gameId) {
      case 'blackjack': return <BlackjackGame key={sessionKey} {...props} />;
      case 'dragon-tower': return <DragonTowerGame key={sessionKey} {...props} />;
      case 'roulette': return <RouletteGame key={sessionKey} {...props} />;
      case 'dice': return <DiceGame key={sessionKey} {...props} />;
      case 'higher-lower': return <HigherLowerGame key={sessionKey} {...props} />;
      case 'mines': return <MinesGame key={sessionKey} {...props} />;
      case 'coin-flip': return <CoinFlipGame key={sessionKey} {...props} />;
      case 'card-guess': return <CardGuessGame key={sessionKey} {...props} />;
      default: return <Text style={{color:'white'}}>Game not found</Text>;
    }
  };

  const restartGame = () => {
    setGameState('PLAYING');
    setSession({
      id: Date.now().toString(),
      gameId: gameId as string,
      alarmId: (alarmId as string) || 'current',
      startedAt: Date.now(),
    });
  };

  // The manual WON screen has been removed since navigation is automatic
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom || Spacing.md }]}>
      <View style={{ flex: 1 }}>
        {renderGame()}
      </View>
      <View style={styles.persistentBottomNav}>
        <Pressable 
          style={styles.bottomNavButton}
          onPress={() => router.back()}
        >
          <Text style={styles.bottomNavButtonText}>
            {isPreview === 'true' ? 'BACK TO SETUP' : 'CHOOSE ANOTHER GAME'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  title: {
    fontSize: 48,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.bodyLarge,
    color: Colors.dark.textMuted,
    textAlign: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.xxl,
  },
  buttonsContainer: {
    width: '100%',
    gap: Spacing.md,
    marginTop: Spacing.xl,
  },
  actionButton: {
    height: UI.buttonHeight,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    ...Typography.bodyLarge,
    fontWeight: '700',
    color: '#FFF',
  },
  persistentBottomNav: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xl,
  },
  bottomNavButton: {
    height: UI.buttonHeight,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.dark.primaryMuted,
    borderWidth: 1,
    borderColor: Colors.dark.primary,
  },
  bottomNavButtonText: {
    ...Typography.bodyLarge,
    fontWeight: '700',
    color: '#FFF',
  },
});
