import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, useColorScheme } from 'react-native';
import { Colors, Typography, Spacing, Radii } from '../../constants/theme';

interface GameProps {
  onWin: () => void;
  onLose: () => void;
}

export default function Dice({ onWin, onLose }: GameProps) {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
  
  const [rolling, setRolling] = useState(false);
  const [result, setResult] = useState<number | null>(null);

  const handleChoice = (choice: 'HIGHER' | 'LOWER') => {
    if (rolling) return;
    setRolling(true);
    
    // Simulate dice roll
    setTimeout(() => {
      const outcome = Math.floor(Math.random() * 6) + 1; // 1 to 6
      setResult(outcome);
      setRolling(false);
      
      setTimeout(() => {
        // Simple logic: If choice is HIGHER, win if outcome >= 4.
        // If choice is LOWER, win if outcome <= 3.
        const won = (choice === 'HIGHER' && outcome >= 4) || (choice === 'LOWER' && outcome <= 3);
        if (won) {
          onWin();
        } else {
          onLose();
        }
      }, 1000);
    }, 1000);
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: theme.text }]}>ROLL THE DICE</Text>
      <Text style={[styles.subtitle, { color: theme.textMuted }]}>Will it be higher (4-6) or lower (1-3)?</Text>
      
      {rolling && (
        <View style={styles.resultContainer}>
          <Text style={[styles.spinningText, { color: theme.textMuted }]}>Rolling...</Text>
        </View>
      )}

      {result && !rolling && (
        <View style={styles.resultContainer}>
          <Text style={[styles.resultText, { color: theme.text }]}>
            {result}
          </Text>
        </View>
      )}

      {!rolling && !result && (
        <View style={styles.buttonsContainer}>
          <Pressable 
            style={[styles.button, { backgroundColor: theme.primary }]}
            onPress={() => handleChoice('HIGHER')}
          >
            <Text style={styles.buttonText}>HIGHER</Text>
          </Pressable>
          <Pressable 
            style={[styles.button, { backgroundColor: theme.primary }]}
            onPress={() => handleChoice('LOWER')}
          >
            <Text style={styles.buttonText}>LOWER</Text>
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
  },
  title: {
    ...Typography.h2,
  },
  subtitle: {
    ...Typography.bodyLarge,
    marginBottom: Spacing.xxl,
    marginTop: Spacing.sm,
  },
  resultContainer: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinningText: {
    ...Typography.h3,
  },
  resultText: {
    ...Typography.h1,
    fontSize: 64,
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.xl,
  },
  button: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radii.md,
  },
  buttonText: {
    ...Typography.h3,
    color: '#FFF',
  }
});
