import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing, runOnJS } from 'react-native-reanimated';
import { Colors, Typography, Spacing, Radii, UI } from '../../constants/theme';
import { spinRoulette } from './rouletteEngine';

interface GameProps {
  onWin: () => void;
  onLose: () => void;
}

const WHEEL_SIZE = 200;
const SLICES = 12;
const SLICE_ANGLE = 360 / SLICES;
const TRIANGLE_WIDTH = 2 * (WHEEL_SIZE / 2) * Math.tan((SLICE_ANGLE / 2) * (Math.PI / 180));

export default function RouletteGame({ onWin, onLose }: GameProps) {
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<'RED' | 'BLACK' | null>(null);
  const rotation = useSharedValue(0);

  const animatedWheelStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  const triggerResult = (outcome: 'RED' | 'BLACK', choice: 'RED' | 'BLACK') => {
    setResult(outcome);
    setSpinning(false);
    setTimeout(() => {
      if (outcome === choice) {
        onWin();
      } else {
        onLose();
      }
    }, 1000);
  };

  const handleChoice = (choice: 'RED' | 'BLACK') => {
    if (spinning) return;
    setSpinning(true);
    setResult(null);
    
    // Reset rotation before spinning again
    rotation.value = rotation.value % 360;
    
    const outcome = spinRoulette();
    
    // RED is at 0 degrees, BLACK is at 330 degrees (which lands at top if we rotate +30)
    const targetDegrees = outcome === 'RED' ? 0 : 30;
    const spins = 5; // Spin 5 full times
    const finalRotation = rotation.value + (360 * spins) + targetDegrees - (rotation.value % 360);

    rotation.value = withTiming(
      finalRotation,
      {
        duration: 3000,
        easing: Easing.out(Easing.cubic),
      },
      () => {
        runOnJS(triggerResult)(outcome, choice);
      }
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ROULETTE</Text>
      <Text style={styles.subtitle}>Choose a color.</Text>
      
      {/* The Animated Wheel */}
      <View style={styles.wheelContainer}>
        {/* Pointer Triangle */}
        <View style={styles.pointer} />
        
        <Animated.View style={[styles.wheel, animatedWheelStyle]}>
          {Array.from({ length: SLICES }).map((_, i) => {
            const isRed = i % 2 === 0;
            return (
              <View
                key={i}
                style={[
                  styles.sliceContainer,
                  { transform: [{ rotate: `${i * SLICE_ANGLE}deg` }] },
                ]}
              >
                <View
                  style={[
                    styles.slice,
                    { borderTopColor: isRed ? Colors.dark.danger : '#111827' },
                  ]}
                />
              </View>
            );
          })}
          {/* Inner decorative circle */}
          <View style={styles.innerCircle} />
        </Animated.View>
      </View>

      <View style={styles.resultContainer}>
        {spinning && <Text style={styles.spinningText}>SPINNING...</Text>}
        {result && !spinning && (
          <Text style={[
            styles.resultText, 
            { color: result === 'RED' ? Colors.dark.danger : Colors.dark.text }
          ]}>
            {result}
          </Text>
        )}
      </View>

      {!spinning && !result && (
        <View style={styles.buttonsContainer}>
          <Pressable 
            style={[styles.button, { backgroundColor: Colors.dark.danger }]}
            onPress={() => handleChoice('RED')}
          >
            <Text style={styles.buttonText}>🔴 RED</Text>
          </Pressable>
          <Pressable 
            style={[styles.button, { backgroundColor: '#111827' }]} // Pure black
            onPress={() => handleChoice('BLACK')}
          >
            <Text style={styles.buttonText}>⚫ BLACK</Text>
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
  wheelContainer: {
    marginVertical: Spacing.xxl,
    alignItems: 'center',
  },
  wheel: {
    width: WHEEL_SIZE,
    height: WHEEL_SIZE,
    borderRadius: WHEEL_SIZE / 2,
    overflow: 'hidden',
    backgroundColor: '#111827',
    borderWidth: 4,
    borderColor: Colors.dark.surface,
  },
  sliceContainer: {
    position: 'absolute',
    width: TRIANGLE_WIDTH,
    height: WHEEL_SIZE,
    left: WHEEL_SIZE / 2 - TRIANGLE_WIDTH / 2,
    top: 0,
    alignItems: 'center',
  },
  slice: {
    width: 0,
    height: 0,
    borderLeftWidth: TRIANGLE_WIDTH / 2,
    borderRightWidth: TRIANGLE_WIDTH / 2,
    borderTopWidth: WHEEL_SIZE / 2,
    borderStyle: 'solid',
    backgroundColor: 'transparent',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  innerCircle: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.dark.surface,
    top: WHEEL_SIZE / 2 - 20,
    left: WHEEL_SIZE / 2 - 20,
    borderWidth: 2,
    borderColor: Colors.dark.border,
  },
  pointer: {
    position: 'absolute',
    top: -15,
    zIndex: 10,
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 20,
    borderStyle: 'solid',
    backgroundColor: 'transparent',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#FFF',
  },
  resultContainer: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  spinningText: {
    ...Typography.h3,
    color: Colors.dark.textMuted,
    letterSpacing: 4,
  },
  resultText: {
    ...Typography.h1,
    fontSize: 56,
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
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  buttonText: {
    ...Typography.h3,
    color: '#FFF',
  }
});
