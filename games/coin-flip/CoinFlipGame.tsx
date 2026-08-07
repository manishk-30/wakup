import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing, runOnJS } from 'react-native-reanimated';
import { Colors, Typography, Spacing, Radii, UI } from '../../constants/theme';
import { flipCoin } from './coinFlipEngine';

interface GameProps {
  onWin: () => void;
  onLose: () => void;
}

export default function CoinFlipGame({ onWin, onLose }: GameProps) {
  const [flipping, setFlipping] = useState(false);
  const [result, setResult] = useState<'HEADS' | 'TAILS' | null>(null);
  const rotation = useSharedValue(0);

  const animatedContainerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotateX: `${rotation.value}deg` }]
    };
  });

  const animatedFrontStyle = useAnimatedStyle(() => {
    const normalized = (rotation.value % 360 + 360) % 360;
    const isFront = normalized < 90 || normalized > 270;
    return {
      opacity: isFront ? 1 : 0,
      zIndex: isFront ? 1 : 0,
    };
  });

  const animatedBackStyle = useAnimatedStyle(() => {
    const normalized = (rotation.value % 360 + 360) % 360;
    const isBack = normalized >= 90 && normalized <= 270;
    return {
      opacity: isBack ? 1 : 0,
      zIndex: isBack ? 1 : 0,
    };
  });

  const triggerResult = (outcome: 'HEADS' | 'TAILS', choice: 'HEADS' | 'TAILS') => {
    setResult(outcome);
    setFlipping(false);
    setTimeout(() => {
      if (outcome === choice) {
        onWin();
      } else {
        onLose();
      }
    }, 1000);
  };

  const handleChoice = (choice: 'HEADS' | 'TAILS') => {
    if (flipping) return;
    setFlipping(true);
    setResult(null);
    
    rotation.value = rotation.value % 360;
    
    const outcome = flipCoin();
    const targetDegrees = outcome === 'HEADS' ? 0 : 180;
    const spins = 6; // 6 half-flips (3 full rotations) + target
    const finalRotation = rotation.value + (360 * 3) + targetDegrees - (rotation.value % 360);

    rotation.value = withTiming(
      finalRotation,
      {
        duration: 2000,
        easing: Easing.out(Easing.cubic),
      },
      () => {
        runOnJS(triggerResult)(outcome, choice);
      }
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>COIN FLIP</Text>
      <Text style={styles.subtitle}>Choose one:</Text>
      
      {/* 3D Animated Coin */}
      <View style={styles.coinWrapper}>
        <Animated.View style={[styles.coinContainer, animatedContainerStyle]}>
          {/* Heads Face */}
          <Animated.View style={[styles.coinFace, styles.coinHeads, animatedFrontStyle]}>
            <View style={styles.coinInner}>
              <Text style={styles.coinText}>HEADS</Text>
            </View>
          </Animated.View>
          {/* Tails Face */}
          <Animated.View style={[styles.coinFace, styles.coinTails, animatedBackStyle]}>
            <View style={styles.coinInner}>
              <Text style={styles.coinText}>TAILS</Text>
            </View>
          </Animated.View>
        </Animated.View>
      </View>

      <View style={styles.resultContainer}>
        {flipping && <Text style={styles.flippingText}>FLIPPING...</Text>}
        {result && !flipping && (
          <Text style={styles.resultText}>
            {result}
          </Text>
        )}
      </View>

      {!flipping && !result && (
        <View style={styles.buttonsContainer}>
          <Pressable 
            style={styles.button}
            onPress={() => handleChoice('HEADS')}
          >
            <Text style={styles.buttonText}>HEADS</Text>
          </Pressable>
          <Pressable 
            style={styles.button}
            onPress={() => handleChoice('TAILS')}
          >
            <Text style={styles.buttonText}>TAILS</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    backgroundColor: Colors.dark.background,
  },
  title: {
    ...Typography.h2,
    color: Colors.dark.text,
    letterSpacing: 2,
  },
  subtitle: {
    ...Typography.bodyLarge,
    color: Colors.dark.textMuted,
    marginTop: Spacing.md,
  },
  coinWrapper: {
    marginVertical: Spacing.xxl,
  },
  coinContainer: {
    width: 150,
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 10,
  },
  coinFace: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 4,
    borderColor: '#D97706', // Darker gold for edge
    alignItems: 'center',
    justifyContent: 'center',
    // Removed backfaceVisibility: 'hidden' because it's buggy on Android. Handled mathematically via opacity.
  },
  coinHeads: {
    backgroundColor: '#F59E0B', // Gold
  },
  coinTails: {
    backgroundColor: '#F59E0B', // Gold
    transform: [{ rotateX: '180deg' }], // Flipped to the back
  },
  coinInner: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: '#D97706',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coinText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FEF3C7', // Light yellow text
    letterSpacing: 2,
  },
  resultContainer: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  flippingText: {
    ...Typography.h3,
    color: Colors.dark.textMuted,
    letterSpacing: 4,
  },
  resultText: {
    ...Typography.h1,
    fontSize: 48,
    color: Colors.dark.text,
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
    width: '100%',
  },
  button: {
    flex: 1,
    height: UI.buttonHeight,
    borderRadius: Radii.md,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.dark.primary,
    borderWidth: 2,
    borderColor: '#000000',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  buttonText: {
    ...Typography.h3,
    color: Colors.dark.text,
  }
});
