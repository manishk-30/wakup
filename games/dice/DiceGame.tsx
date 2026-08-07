import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSequence, Easing, runOnJS } from 'react-native-reanimated';
import { Colors, Typography, Spacing, Radii, UI } from '../../constants/theme';
import { rollDice, checkDiceWin } from './diceEngine';

interface GameProps {
  onWin: () => void;
  onLose: () => void;
}

const dotMap: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

const DiceFace = ({ value }: { value: number }) => {
  const activeDots = dotMap[value] || dotMap[1];
  return (
    <View style={styles.diceFace}>
      {Array.from({ length: 9 }).map((_, i) => (
        <View key={i} style={[styles.dot, { opacity: activeDots.includes(i) ? 1 : 0 }]} />
      ))}
    </View>
  );
};

export default function DiceGame({ onWin, onLose }: GameProps) {
  const [rolling, setRolling] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [won, setWon] = useState<boolean | null>(null);
  const [tempFace, setTempFace] = useState(1);
  
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);

  const animatedDiceStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: translateY.value },
        { scale: scale.value },
        { rotateZ: `${rotation.value}deg` }
      ]
    };
  });

  const triggerResult = (outcome: number, choice: 'HIGH' | 'LOW' | 'ODD' | 'EVEN') => {
    const isWin = checkDiceWin(outcome, choice);
    setResult(outcome);
    setWon(isWin);
    setRolling(false);
    setTimeout(() => {
      if (isWin) {
        onWin();
      } else {
        onLose();
      }
    }, 1000);
  };

  const handleChoice = (choice: 'HIGH' | 'LOW' | 'ODD' | 'EVEN') => {
    if (rolling) return;
    setRolling(true);
    setResult(null);
    setWon(null);
    
    // Reset animations
    rotation.value = 0;
    scale.value = 1;
    translateY.value = 0;

    const outcome = rollDice();
    
    // Rapidly change faces while rolling
    const interval = setInterval(() => {
      setTempFace(Math.floor(Math.random() * 6) + 1);
    }, 100);

    // Animate physics (Total duration 1500ms)
    rotation.value = withTiming(1080, { duration: 1500, easing: Easing.out(Easing.cubic) });
    
    scale.value = withSequence(
      withTiming(1.5, { duration: 750, easing: Easing.out(Easing.quad) }),
      withTiming(1, { duration: 750, easing: Easing.bounce })
    );
    
    translateY.value = withSequence(
      withTiming(-100, { duration: 750, easing: Easing.out(Easing.quad) }),
      withTiming(0, { duration: 750, easing: Easing.bounce })
    );

    // Sync JS logic with animation completion
    setTimeout(() => {
      clearInterval(interval);
      triggerResult(outcome, choice);
    }, 1500);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>DICE</Text>
      <Text style={styles.subtitle}>Predict the roll.</Text>
      
      <View style={styles.animationArea}>
        <Animated.View style={animatedDiceStyle}>
          <DiceFace value={result || tempFace} />
        </Animated.View>
      </View>

      <View style={styles.resultContainer}>
        {rolling && <Text style={styles.spinningText}>ROLLING...</Text>}
        {result && !rolling && (
          <Text style={[styles.resultMainText, { color: won ? Colors.dark.success : Colors.dark.danger }]}>
            {won ? 'YOU WIN 🎉' : 'YOU LOST'}
          </Text>
        )}
      </View>

      {!rolling && !result && (
        <View style={styles.controlsWrapper}>
          <View style={styles.buttonsContainer}>
            <Pressable 
              style={styles.button}
              onPress={() => handleChoice('HIGH')}
            >
              <Text style={styles.buttonText}>HIGH</Text>
              <Text style={styles.subButtonText}>4, 5, 6</Text>
            </Pressable>
            <Pressable 
              style={styles.button}
              onPress={() => handleChoice('LOW')}
            >
              <Text style={styles.buttonText}>LOW</Text>
              <Text style={styles.subButtonText}>1, 2, 3</Text>
            </Pressable>
          </View>
          <View style={styles.buttonsContainer}>
            <Pressable 
              style={styles.button}
              onPress={() => handleChoice('EVEN')}
            >
              <Text style={styles.buttonText}>EVEN</Text>
              <Text style={styles.subButtonText}>2, 4, 6</Text>
            </Pressable>
            <Pressable 
              style={styles.button}
              onPress={() => handleChoice('ODD')}
            >
              <Text style={styles.buttonText}>ODD</Text>
              <Text style={styles.subButtonText}>1, 3, 5</Text>
            </Pressable>
          </View>
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
  animationArea: {
    height: 180,
    justifyContent: 'flex-end', // So it bounces up from the bottom
    alignItems: 'center',
    paddingBottom: Spacing.xl,
  },
  diceFace: {
    width: 100,
    height: 100,
    backgroundColor: '#FFF', // White dice
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: Radii.md,
    padding: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 8,
  },
  dot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#111827', // Dark dot
  },
  resultContainer: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  spinningText: {
    ...Typography.h3,
    color: Colors.dark.textMuted,
    letterSpacing: 4,
  },
  resultMainText: {
    ...Typography.h2,
    fontSize: 40,
    fontWeight: '800',
  },
  controlsWrapper: {
    width: '100%',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
  },
  button: {
    flex: 1,
    height: UI.buttonHeight * 1.5,
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
  },
  subButtonText: {
    ...Typography.caption,
    color: '#000000',
    marginTop: 4,
  }
});
