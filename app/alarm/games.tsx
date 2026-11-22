import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, Typography, Spacing, Radii, UI } from '../../constants/theme';
import { alarmService } from '../../services/alarmService';
import { storageService } from '../../services/storageService';
import { reviewService } from '../../services/reviewService';
import { GameSession } from '../../types/games';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ALARM_SOUNDS } from '../../constants/sounds';

// Import Games
import SundokuGame from '../../games/sundoku/SundokuGame';
import DragonTowerGame from '../../games/dragon-tower/DragonTowerGame';
import RouletteGame from '../../games/roulette/RouletteGame';
import DiceGame from '../../games/dice/DiceGame';
import HigherLowerGame from '../../games/higher-lower/HigherLowerGame';
import MinesGame from '../../games/mines/MinesGame';
import CoinFlipGame from '../../games/coin-flip/CoinFlipGame';
import CardGuessGame from '../../games/card-guess/CardGuessGame';
import LuckyRaceGame from '../../games/lucky-race/LuckyRaceGame';
import PotionMixGame from '../../games/potion-mix/PotionMixGame';
import GameCelebration from '../../components/GameCelebration';
import PortraitContainer from '../../components/PortraitContainer';

export default function GameScreen() {
  const { gameId, alarmId, isPreview } = useLocalSearchParams();
  const router = useRouter();
  
  const [gameState, setGameState] = useState<'PLAYING' | 'WON' | 'LOST'>('PLAYING');
  const [isCelebrating, setIsCelebrating] = useState(false);
  const [session, setSession] = useState<GameSession | null>(null);
  const [skipTimeLeft, setSkipTimeLeft] = useState(60);

  useEffect(() => {
    // Only initialize session if it doesn't exist to prevent infinite loops
    if (!session) {
      setSession({
        id: Date.now().toString(),
        gameId: gameId as string,
        alarmId: (alarmId as string) || 'current',
        startedAt: Date.now(),
      });
    }

    if (isPreview === 'true') {
      setSkipTimeLeft(0);
      const playPreviewSound = async () => {
        await alarmService.configureAudioSession();
        await alarmService.playForegroundAlarm(ALARM_SOUNDS[0].file);
      };
      playPreviewSound();

      return () => {
        alarmService.stopForegroundAlarm();
      };
    } else {
      setSkipTimeLeft(60);
      const timer = setInterval(() => {
        setSkipTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId, isPreview]);

  const handleWin = () => {
    setGameState('WON');
    if (session) {
      session.result = 'win';
    }
    setIsCelebrating(true);
  };

  const handleCelebrationFinish = async () => {
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
    
    // Prompt App Store review after winning alarm challenge (high satisfaction moment)
    await reviewService.recordChallengeWinAndPromptReview();
    
    console.log('[Navigation] Returning to Home after challenge completion');
    router.replace('/');
  };

  const handleLose = () => {
    setGameState('LOST');
    if (session) {
      session.result = 'loss';
    }
    // Auto-restart game instantly without showing the intermediate generic loss screen
    restartGame();
  };

  const renderGame = () => {
    const props = { onWin: handleWin, onLose: handleLose, gameState };
    const sessionKey = session?.id;
    switch (gameId) {
      case 'blackjack': return <SundokuGame key={sessionKey} {...props} />;
      case 'dragon-tower': return <DragonTowerGame key={sessionKey} {...props} />;
      case 'lucky-race': return <LuckyRaceGame key={sessionKey} {...props} />;
      case 'potion-mix': return <PotionMixGame key={sessionKey} {...props} />;
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
    setIsCelebrating(false);
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
    <View style={styles.container}>
      <View style={[styles.contentLayout, { paddingTop: Math.max(insets.top + Spacing.sm, 72), paddingBottom: insets.bottom || Spacing.md }]}>
        <PortraitContainer>
          {gameId === 'blackjack' ? (
            <View style={styles.gameViewContainer}>
              {renderGame()}
            </View>
          ) : (
            <ScrollView
              style={styles.gameScrollView}
              contentContainerStyle={styles.gameScrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              bounces={true}
            >
              {renderGame()}
            </ScrollView>
          )}
          <View style={styles.persistentBottomNav}>
            <Pressable 
              style={[
                styles.bottomNavButton,
                skipTimeLeft > 0 ? { opacity: 0.5, backgroundColor: Colors.dark.surface } : {}
              ]}
              disabled={skipTimeLeft > 0}
              onPress={() => {
                if (isPreview === 'true') {
                  router.back();
                } else {
                  router.replace(`/alarm/ringing?alarmId=${alarmId || 'current'}&forceList=true`);
                }
              }}
            >
              <Text 
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.75}
                style={[styles.bottomNavButtonText, skipTimeLeft > 0 ? { color: Colors.dark.textMuted } : {}]}
              >
                {isPreview === 'true' 
                  ? 'CHOOSE ANOTHER GAME' 
                  : skipTimeLeft > 0 
                    ? `CHOOSE ANOTHER GAME (${skipTimeLeft}s)` 
                    : 'CHOOSE ANOTHER GAME'}
              </Text>
            </Pressable>
          </View>
        </PortraitContainer>
      </View>

      {/* Full-screen celebration overlay covering notch, home bar, and edges */}
      {isCelebrating && (
        <GameCelebration
          title={gameId === 'blackjack' ? 'Puzzle Solved!' : 'Challenge Completed!'}
          subtitle={
            gameId === 'blackjack'
              ? 'All 6 Suns Found • Alarm Beaten!'
              : 'Alarm Beaten • Great Job!'
          }
          onFinish={handleCelebrationFinish}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  contentLayout: {
    flex: 1,
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
  gameViewContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  gameScrollView: {
    flex: 1,
  },
  gameScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingBottom: Spacing.xl,
  },
  persistentBottomNav: {
    backgroundColor: Colors.dark.background,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
    zIndex: 10,
  },
  bottomNavButton: {
    height: UI.buttonHeight,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.dark.primaryMuted,
    borderWidth: 1,
    borderColor: Colors.dark.primary,
  },
  bottomNavButtonText: {
    ...Typography.bodyLarge,
    fontWeight: '700',
    color: '#FFF',
    textAlign: 'center',
  },
});
