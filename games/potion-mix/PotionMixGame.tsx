import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { Accelerometer } from 'expo-sensors';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, Typography } from '../../constants/theme';

type PotionState = 'mixing' | 'won' | 'lost' | 'restarting';
type PotionOutcome = 'golden' | 'murky_purple' | 'murky_gray' | 'murky_green';

interface PotionMixGameProps {
  onWin: () => void;
  onLose: () => void;
}

export default function PotionMixGame({ onWin, onLose }: PotionMixGameProps) {
  const [gameState, setGameState] = useState<PotionState>('mixing');
  const [shakeCount, setShakeCount] = useState(0);
  
  // Ref for mutable state
  const stateRef = useRef({
    requiredShakes: 20, // Exactly 20 taps or shakes
    result: ((): PotionOutcome => {
      const rand = Math.random();
      // 50% chance of winning Golden potion
      if (rand < 0.50) return 'golden';
      // 50% chance of losing (split into 3 loss colors: Murky Purple, Toxic Ash, Swamp Slime)
      if (rand < 0.67) return 'murky_purple';
      if (rand < 0.84) return 'murky_gray';
      return 'murky_green';
    })(),
    lastShakeTime: 0,
    shakeCount: 0
  });

  // Animations
  const flaskShakeAnim = useRef(new Animated.Value(0)).current;
  const flaskScaleAnim = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0.3)).current;
  const colorPulseAnim = useRef(new Animated.Value(0)).current;
  
  // Idle pulsing animation
  useEffect(() => {
    let idleAnim: Animated.CompositeAnimation | null = null;
    
    if (gameState === 'mixing') {
      idleAnim = Animated.loop(
        Animated.sequence([
          Animated.timing(glowOpacity, { toValue: 0.7, duration: 1500, useNativeDriver: false }),
          Animated.timing(glowOpacity, { toValue: 0.3, duration: 1500, useNativeDriver: false }),
        ])
      );
      idleAnim.start();
    }
    
    return () => idleAnim?.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState]);

  // Shake detection
  useEffect(() => {
    let subscription: any;
    
    if (gameState === 'mixing') {
      Accelerometer.setUpdateInterval(100);
      subscription = Accelerometer.addListener(accelerometerData => {
        const { x, y, z } = accelerometerData;
        const acceleration = Math.sqrt(x * x + y * y + z * z);
        
        // 1.5g threshold
        if (acceleration > 1.5) {
          const now = Date.now();
          if (now - stateRef.current.lastShakeTime > 400) {
            stateRef.current.lastShakeTime = now;
            handleValidShake();
          }
        }
      });
    }

    return () => {
      subscription?.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState]);

  const handleValidShake = () => {
    if (gameState !== 'mixing') return;
    
    const newCount = stateRef.current.shakeCount + 1;
    stateRef.current.shakeCount = newCount;
    setShakeCount(newCount);
    
    const { requiredShakes } = stateRef.current;
    const progress = newCount / requiredShakes;
    
    // Shift color pulse forward
    Animated.timing(colorPulseAnim, {
      toValue: progress,
      duration: 300,
      useNativeDriver: false
    }).start();

    if (newCount >= requiredShakes) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      startExplosionAnimation();
    } else {
      // Normal shake reaction
      if (progress > 0.8) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        Animated.sequence([
          Animated.timing(flaskShakeAnim, { toValue: 20, duration: 50, useNativeDriver: true }),
          Animated.timing(flaskShakeAnim, { toValue: -20, duration: 50, useNativeDriver: true }),
          Animated.timing(flaskShakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
        ]).start();
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        Animated.sequence([
          Animated.timing(flaskShakeAnim, { toValue: 10, duration: 80, useNativeDriver: true }),
          Animated.timing(flaskShakeAnim, { toValue: -10, duration: 80, useNativeDriver: true }),
          Animated.timing(flaskShakeAnim, { toValue: 0, duration: 80, useNativeDriver: true }),
        ]).start();
      }
    }
  };

  const startExplosionAnimation = () => {
    const isWin = stateRef.current.result === 'golden';
    setGameState(isWin ? 'won' : 'lost');
    
    // Final burst animation
    Animated.sequence([
      Animated.timing(flaskShakeAnim, { toValue: 30, duration: 40, useNativeDriver: true }),
      Animated.timing(flaskShakeAnim, { toValue: -30, duration: 40, useNativeDriver: true }),
      Animated.timing(flaskShakeAnim, { toValue: 30, duration: 40, useNativeDriver: true }),
      Animated.timing(flaskShakeAnim, { toValue: -30, duration: 40, useNativeDriver: true }),
      Animated.timing(flaskShakeAnim, { toValue: 0, duration: 40, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(flaskScaleAnim, { toValue: 1.3, duration: 400, useNativeDriver: true }),
        Animated.timing(glowOpacity, { toValue: 1, duration: 400, useNativeDriver: false })
      ])
    ]).start(() => {
      if (isWin) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setTimeout(() => onWin(), 1000);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setTimeout(() => {
          setGameState('restarting');
          onLose();
        }, 1500);
      }
    });
  };

  const handleTapFallback = () => handleValidShake();

  const getMessage = () => {
    if (gameState === 'won') {
      return 'Golden Potion! 🧪';
    }
    if (gameState === 'lost') {
      if (stateRef.current.result === 'murky_gray') return 'Ash & Smoke... 💨';
      if (stateRef.current.result === 'murky_green') return 'Swamp Slime... 💨';
      return 'Murky Slop... 💨';
    }
    if (gameState === 'restarting') return 'Restarting...';
    
    const progress = shakeCount / stateRef.current.requiredShakes;
    if (progress === 0) return 'Tap or shake to mix';
    if (progress < 0.4) return 'Keep mixing!';
    if (progress < 0.8) return 'It\'s glowing!';
    return 'Almost done!';
  };

  const getSubMessage = () => {
    if (gameState === 'won') return 'Pure elixir brewed! Alarm beaten.';
    if (gameState === 'lost') return 'Failed mixture. Try again.';
    if (gameState === 'restarting') return '';
    return 'Mix until the color blooms.';
  };

  // Interpolate glowing color based on progress (Cyan -> Blue -> Purple -> Magenta -> Orange)
  const mixingColor = colorPulseAnim.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: ['#00B4D8', '#3A86FF', '#7209B7', '#F72585', '#FFD166']
  });

  const getOutcomeColor = () => {
    if (gameState === 'won') {
      return '#FFD166'; // Golden Win
    }
    if (gameState === 'lost' || gameState === 'restarting') {
      // 3 distinct loss colors
      if (stateRef.current.result === 'murky_gray') return '#4B5563'; // Grayish Ash
      if (stateRef.current.result === 'murky_green') return '#14532D'; // Swamp Slime Green
      return '#4A0E4E'; // Dark Purple Murk
    }
    return mixingColor;
  };

  const finalColor = getOutcomeColor();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>POTION MIX</Text>
      <Text style={styles.ruleText}>Golden = Win  |  Murky, Ash or Slime = Loss</Text>
      
      <View style={styles.centerContainer}>
        <Pressable onPress={handleTapFallback} style={styles.potionContainer}>
          {/* Dynamic Glow Background */}
          <Animated.View style={[
            styles.glow, 
            { 
              transform: [
                { scale: flaskScaleAnim },
                { translateX: flaskShakeAnim }
              ]
            }
          ]}>
            <Animated.View style={{
              flex: 1,
              borderRadius: 16,
              backgroundColor: finalColor as any,
              opacity: glowOpacity,
            }} />
          </Animated.View>
        </Pressable>
      </View>
      
      <View style={styles.bottomContainer}>
        <Text style={styles.message}>{getMessage()}</Text>
        <Text style={styles.subMessage}>{getSubMessage()}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    backgroundColor: '#FFFFFF',
    padding: Spacing.md,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    ...Typography.h1,
    color: Colors.light.text,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  potionContainer: {
    width: 240,
    height: 240,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  glow: {
    position: 'absolute',
    width: 130,
    height: 200,
    borderRadius: 20,
    top: 20,
    left: 55,
    zIndex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  bottomContainer: {
    height: 70,
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  message: {
    ...Typography.h2,
    color: Colors.light.text,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subMessage: {
    ...Typography.bodyLarge,
    color: Colors.light.textMuted,
    textAlign: 'center',
  },
  ruleText: {
    ...Typography.body,
    color: Colors.light.text,
    textAlign: 'center',
    marginTop: Spacing.sm,
    fontWeight: '600',
    opacity: 0.8,
  }
});
