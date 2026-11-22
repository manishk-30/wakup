import { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing, runOnJS } from 'react-native-reanimated';
import { Colors, Typography, Spacing, Radii, UI } from '../../constants/theme';
import { spinRoulette, WheelColor } from './rouletteEngine';

interface GameProps {
  onWin: () => void;
  onLose: () => void;
}

const WHEEL_SIZE = 220;
const SLICES = 12; // 3 slices of each of the 4 colors
const SLICE_ANGLE = 360 / SLICES; // 30 degrees each
const TRIANGLE_WIDTH = 2 * (WHEEL_SIZE / 2) * Math.tan((SLICE_ANGLE / 2) * (Math.PI / 180));

const COLOR_CONFIG: Record<WheelColor, { hex: string; label: string; emoji: string }> = {
  RED: { hex: '#EF4444', label: 'RED', emoji: '🔴' },
  BLUE: { hex: '#3B82F6', label: 'BLUE', emoji: '🔵' },
  GREEN: { hex: '#10B981', label: 'GREEN', emoji: '🟢' },
  YELLOW: { hex: '#F59E0B', label: 'YELLOW', emoji: '🟡' },
};

// 12 slices pattern repeating: RED, BLUE, GREEN, YELLOW (3 times)
const SLICE_COLORS: WheelColor[] = [
  'RED', 'BLUE', 'GREEN', 'YELLOW',
  'RED', 'BLUE', 'GREEN', 'YELLOW',
  'RED', 'BLUE', 'GREEN', 'YELLOW',
];

export default function RouletteGame({ onWin, onLose }: GameProps) {
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<WheelColor | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const rotation = useSharedValue(0);

  const animatedWheelStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  const triggerResult = (outcome: WheelColor, choice: WheelColor) => {
    setResult(outcome);
    setSpinning(false);
    const correct = outcome === choice;
    setIsCorrect(correct);

    setTimeout(() => {
      if (correct) {
        onWin();
      } else {
        // Reset state so user can spin again if game restarts in place
        setTimeout(() => {
          setResult(null);
          setIsCorrect(null);
        }, 1200);
        onLose();
      }
    }, 1200);
  };

  const handleChoice = (choice: WheelColor) => {
    if (spinning) return;
    setSpinning(true);
    setResult(null);
    setIsCorrect(null);
    
    // Normalize rotation angle
    rotation.value = rotation.value % 360;
    
    const outcome = spinRoulette();
    
    // Pick one of the matching slices for this outcome
    const matchingIndices = SLICE_COLORS.map((c, i) => c === outcome ? i : -1).filter(i => i !== -1);
    const targetSliceIndex = matchingIndices[Math.floor(Math.random() * matchingIndices.length)];
    
    // Each slice is centered at targetSliceIndex * SLICE_ANGLE.
    // To land the slice center exactly under the pointer at 12 o'clock (0°), rotate by:
    const sliceCenterAngle = targetSliceIndex * SLICE_ANGLE;
    const targetDegrees = (360 - (sliceCenterAngle % 360)) % 360;
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
      <Text numberOfLines={1} adjustsFontSizeToFit style={styles.title}>COLOR WHEEL</Text>
      <Text style={styles.subtitle}>Choose a color to spin.</Text>
      
      {/* The Animated Wheel */}
      <View style={styles.wheelContainer}>
        {/* Pointer Triangle */}
        <View style={styles.pointer} />
        
        <Animated.View style={[styles.wheel, animatedWheelStyle]}>
          {SLICE_COLORS.map((colorKey, i) => {
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
                    { borderTopColor: COLOR_CONFIG[colorKey].hex },
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
        {spinning && (
          <Text style={styles.spinningText}>SPINNING...</Text>
        )}
        {result && !spinning && (
          <View style={styles.resultBox}>
            <Text style={[styles.resultText, { color: COLOR_CONFIG[result].hex }]}>
              {COLOR_CONFIG[result].emoji} {COLOR_CONFIG[result].label}
            </Text>
            {isCorrect === true && (
              <Text style={styles.correctBadge}>✓ CORRECT! YOU WIN 🎉</Text>
            )}
            {isCorrect === false && (
              <Text style={styles.incorrectBadge}>✗ INCORRECT! TRY AGAIN</Text>
            )}
          </View>
        )}
      </View>

      <View style={styles.buttonsGrid}>
        {(['RED', 'BLUE', 'GREEN', 'YELLOW'] as WheelColor[]).map((col) => (
          <Pressable 
            key={col}
            disabled={spinning || result !== null}
            style={({ pressed }) => [
              styles.button,
              { backgroundColor: COLOR_CONFIG[col].hex },
              (spinning || result !== null) && { opacity: 0.45 },
              pressed && { opacity: 0.8 },
            ]}
            onPress={() => handleChoice(col)}
          >
            <Text style={styles.buttonText}>{COLOR_CONFIG[col].emoji} {COLOR_CONFIG[col].label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.dark.background,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.dark.text,
    letterSpacing: 1.5,
    marginBottom: 2,
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.bodyLarge,
    color: Colors.dark.textMuted,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  wheelContainer: {
    width: WHEEL_SIZE,
    height: WHEEL_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xs,
    marginBottom: Spacing.xs,
    position: 'relative',
  },
  wheel: {
    width: WHEEL_SIZE,
    height: WHEEL_SIZE,
    borderRadius: WHEEL_SIZE / 2,
    overflow: 'hidden',
    backgroundColor: '#111827',
    borderWidth: 4,
    borderColor: '#374151',
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
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1F2937',
    top: WHEEL_SIZE / 2 - 22,
    left: WHEEL_SIZE / 2 - 22,
    borderWidth: 3,
    borderColor: '#F9FAFB',
  },
  pointer: {
    position: 'absolute',
    top: -16,
    left: WHEEL_SIZE / 2 - 12,
    zIndex: 2,
    width: 0,
    height: 0,
    borderLeftWidth: 12,
    borderRightWidth: 12,
    borderTopWidth: 22,
    borderStyle: 'solid',
    backgroundColor: 'transparent',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#78350F', // Warm rich brown
  },
  resultContainer: {
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: Spacing.xs,
  },
  resultBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinningText: {
    ...Typography.h3,
    color: Colors.dark.textMuted,
    letterSpacing: 4,
  },
  resultText: {
    ...Typography.h1,
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 2,
  },
  correctBadge: {
    ...Typography.bodyLarge,
    color: '#10B981',
    fontWeight: '800',
    letterSpacing: 1,
  },
  incorrectBadge: {
    ...Typography.bodyLarge,
    color: '#EF4444',
    fontWeight: '800',
    letterSpacing: 1,
  },
  buttonsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
    width: '100%',
    justifyContent: 'center',
  },
  button: {
    width: '47%',
    height: 50,
    borderRadius: Radii.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  buttonText: {
    ...Typography.h3,
    color: '#FFF',
    fontWeight: '700',
  }
});
