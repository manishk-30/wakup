import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { Accelerometer } from 'expo-sensors';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { Colors, Spacing, Typography } from '../../constants/theme';

type PotionState = 'mixing' | 'won' | 'lost' | 'restarting';

interface PotionMixGameProps {
  onWin: () => void;
  onLose: () => void;
}

export default function PotionMixGame({ onWin, onLose }: PotionMixGameProps) {
  const [gameState, setGameState] = useState<PotionState>('mixing');
  const [shakeCount, setShakeCount] = useState(0);
  
  // Ref for mutable state
  const stateRef = useRef({
    requiredShakes: 10 + Math.floor(Math.random() * 6), // 10 to 15
    result: Math.random() > 0.5 ? 'golden' : 'murky',
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
    // Determine winner purely on final result state
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
    if (gameState === 'won') return 'Golden Potion! 🧪';
    if (gameState === 'lost') return 'Murky slop... 💨';
    if (gameState === 'restarting') return 'Restarting...';
    
    const progress = shakeCount / stateRef.current.requiredShakes;
    if (progress === 0) return 'Tap or shake to mix';
    if (progress < 0.4) return 'Keep mixing!';
    if (progress < 0.8) return 'It\'s glowing!';
    return 'Almost done!';
  };

  const getSubMessage = () => {
    if (gameState === 'won') return 'Perfect brew. Alarm beaten.';
    if (gameState === 'lost') return 'Failed mixture. Try again.';
    if (gameState === 'restarting') return '';
    return 'Mix until the color blooms.';
  };

  // Mascot removed per request

  // Interpolate glowing color based on progress (Blue -> Purple -> Magenta -> Orange)
  const mixingColor = colorPulseAnim.interpolate({
    inputRange: [0, 0.3, 0.6, 0.9, 1],
    outputRange: ['#00B4D8', '#7209B7', '#F72585', '#F8961E', '#FFD166']
  });

  const finalColor = gameState === 'won' ? '#FFD166' : (gameState === 'lost' || gameState === 'restarting' ? '#4A0E4E' : mixingColor);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>POTION MIX</Text>
      <Text style={styles.ruleText}>Golden = Win    |    Other = Loss</Text>
      
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
              backgroundColor: finalColor as any, // TypeScript sometimes complains about Animated colors
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
    backgroundColor: '#FFFFFF',
    padding: Spacing.xl,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    ...Typography.h1,
    color: Colors.light.text,
    marginTop: Spacing.xl,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  mascot: {
    width: 80,
    height: 80,
    marginBottom: Spacing.xl,
  },
  potionContainer: {
    width: 300,
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  potionEmoji: {
    fontSize: 120,
    textAlign: 'center',
    zIndex: 10,
  },
  glow: {
    position: 'absolute',
    width: 160,
    height: 260,
    borderRadius: 20,
    top: 20,
    left: 70,
    zIndex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  bottomContainer: {
    height: 100,
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: Spacing.xl,
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
