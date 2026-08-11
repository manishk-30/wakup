import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Dimensions, Easing } from 'react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, Radii, Typography, UI } from '../../constants/theme';

const { width } = Dimensions.get('window');

type RaceState = 'selecting' | 'countdown' | 'racing' | 'won' | 'lost';

interface Racer {
  id: string;
  emoji: string;
  name: string;
}

const RACERS: Racer[] = [
  { id: 'fox', emoji: '🦊', name: 'Fox' },
  { id: 'rabbit', emoji: '🐰', name: 'Rabbit' },
  { id: 'bear', emoji: '🐻', name: 'Bear' },
  { id: 'frog', emoji: '🐸', name: 'Frog' },
  { id: 'cat', emoji: '🐱', name: 'Cat' },
];

interface LuckyRaceGameProps {
  onWin: () => void;
  onLose: () => void;
}

export default function LuckyRaceGame({ onWin, onLose }: LuckyRaceGameProps) {
  const [gameState, setGameState] = useState<RaceState>('selecting');
  const [selectedRacerId, setSelectedRacerId] = useState<string | null>(null);
  const [winnerId, setWinnerId] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | string>(3);
  
  // Track width for racing animation calculation
  const trackWidth = width - (Spacing.lg * 2) - 40; // Total width minus padding minus racer icon size
  
  // Animations
  const countdownScale = useRef(new Animated.Value(0)).current;
  const raceProgress = useRef(RACERS.map(() => new Animated.Value(0))).current;
  
  useEffect(() => {
    if (gameState === 'countdown') {
      runCountdown();
    } else if (gameState === 'racing') {
      runRace();
    }
  }, [gameState]);

  const handleSelectRacer = (id: string) => {
    if (gameState !== 'selecting') return;
    Haptics.selectionAsync();
    setSelectedRacerId(id);
    
    // Auto-start race immediately upon selection
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const randomWinnerIndex = Math.floor(Math.random() * RACERS.length);
    setWinnerId(RACERS[randomWinnerIndex].id);
    setGameState('countdown');
  };


  const runCountdown = () => {
    const sequence = [3, 2, 1, 'GO!'];
    let step = 0;
    
    const tick = () => {
      if (step < sequence.length) {
        setCountdown(sequence[step]);
        countdownScale.setValue(0);
        
        Animated.spring(countdownScale, {
          toValue: 1,
          friction: 5,
          useNativeDriver: true,
        }).start();
        
        if (sequence[step] === 'GO!') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          setTimeout(() => {
            setGameState('racing');
          }, 800);
        } else {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setTimeout(tick, 800);
        }
        step++;
      }
    };
    
    tick();
  };

  const runRace = () => {
    const duration = 4000; // 4 seconds race
    
    // Create random, non-linear animations for each racer
    const animations = RACERS.map((racer, index) => {
      const isWinner = racer.id === winnerId;
      // The winner must finish precisely at trackWidth. Others finish randomly behind.
      const finalPosition = isWinner ? trackWidth : trackWidth * (0.6 + Math.random() * 0.35);
      
      return Animated.timing(raceProgress[index], {
        toValue: finalPosition,
        duration: duration + (isWinner ? 0 : Math.random() * 500), // Winner crosses exactly at 4s
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        useNativeDriver: true,
      });
    });

    Animated.parallel(animations).start(() => {
      // Race finished
      if (selectedRacerId === winnerId) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        // Instantly stop the alarm
        onWin();
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        // Instantly restart via parent component
        onLose();
      }
    });
  };

  const renderCountdownOverlay = () => (
    <View style={StyleSheet.absoluteFill}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.7)', zIndex: 100 }}>
        <Animated.Text style={[styles.countdownText, { transform: [{ scale: countdownScale }] }]}>
          {countdown}
        </Animated.Text>
      </View>
    </View>
  );

  const renderTrack = () => (
    <View style={styles.raceContainer}>
      <Text style={styles.raceTitle}>
        {gameState === 'selecting' ? 'Tap an animal to race' : 'RACING!'}
      </Text>
      
      <View style={styles.trackArea}>
        {RACERS.map((racer, index) => {
          const isSelected = selectedRacerId === racer.id;
          return (
            <Pressable 
              key={racer.id} 
              style={[
                styles.lane,
                isSelected && { backgroundColor: 'rgba(255, 176, 0, 0.15)' }
              ]}
              onPress={() => gameState === 'selecting' && handleSelectRacer(racer.id)}
            >
              <Animated.View style={[styles.racerMoving, { transform: [{ translateX: raceProgress[index] }] }]}>
                <Text style={styles.raceEmoji}>{racer.emoji}</Text>
                {isSelected && <Text style={styles.youIndicator}>YOU</Text>}
              </Animated.View>
              <View style={styles.finishLineMarker} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );

  const renderResult = () => {
    return null;
  };

  return (
    <View style={styles.container}>
      {(gameState === 'selecting' || gameState === 'countdown' || gameState === 'racing') && renderTrack()}
      {gameState === 'countdown' && renderCountdownOverlay()}
      {(gameState === 'won' || gameState === 'lost') && renderResult()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
    padding: Spacing.lg,
  },
  fullContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: Spacing.xl,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    ...Typography.h1,
    color: Colors.light.text,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.bodyLarge,
    color: Colors.light.textMuted,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  introRacersRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xl,
  },
  introRacerIcon: {
    fontSize: 40,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  racerCard: {
    width: '45%',
    backgroundColor: Colors.light.surface,
    padding: Spacing.lg,
    borderRadius: Radii.lg,
    borderWidth: 2,
    borderColor: Colors.light.border,
    alignItems: 'center',
    position: 'relative',
  },
  racerCardSelected: {
    borderColor: Colors.light.primary,
    backgroundColor: 'rgba(255, 176, 0, 0.1)',
  },
  racerCardEmoji: {
    fontSize: 48,
    marginBottom: Spacing.sm,
  },
  racerCardName: {
    ...Typography.bodyLarge,
    fontWeight: '700',
    color: Colors.light.text,
  },
  checkBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: Colors.light.success,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    backgroundColor: Colors.light.primary,
    padding: Spacing.md,
    borderRadius: Radii.full,
    alignItems: 'center',
    marginTop: Spacing.xl,
    height: UI.buttonHeight,
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: Colors.light.border,
  },
  buttonText: {
    ...Typography.bodyLarge,
    fontWeight: '800',
    color: '#FFF',
  },
  countdownText: {
    fontSize: 120,
    fontWeight: '900',
    color: Colors.light.primary,
  },
  raceContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  raceTitle: {
    ...Typography.h2,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    color: Colors.light.text,
  },
  trackArea: {
    width: '100%',
    gap: Spacing.md,
    borderRightWidth: 4,
    borderRightColor: '#E5E7EB', // Finish line visual
    paddingRight: 4,
  },
  lane: {
    width: '100%',
    height: 50,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    justifyContent: 'center',
    position: 'relative',
  },
  racerMoving: {
    width: 40,
    alignItems: 'center',
    position: 'absolute',
    left: 0,
    zIndex: 10,
  },
  raceEmoji: {
    fontSize: 32,
  },
  youIndicator: {
    fontSize: 10,
    fontWeight: '900',
    color: Colors.light.primary,
    marginTop: -4,
  },
  finishLineMarker: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 8,
    backgroundColor: 'transparent', // The borderRight on trackArea acts as the line
  },
  resultEmoji: {
    fontSize: 80,
    marginBottom: Spacing.md,
  },
});
