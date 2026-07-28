import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, useColorScheme } from 'react-native';
import { Colors, Typography, Spacing, Radii } from '../../constants/theme';

interface GameProps {
  onWin: () => void;
  onLose: () => void;
}

export default function CoinFlip({ onWin, onLose }: GameProps) {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
  
  const [flipping, setFlipping] = useState(false);
  const [result, setResult] = useState<'HEADS' | 'TAILS' | null>(null);

  const handleChoice = (choice: 'HEADS' | 'TAILS') => {
    if (flipping) return;
    setFlipping(true);
    
    setTimeout(() => {
      const outcome = Math.random() > 0.5 ? 'HEADS' : 'TAILS';
      setResult(outcome);
      setFlipping(false);
      
      setTimeout(() => {
        if (outcome === choice) {
          onWin();
        } else {
          onLose();
        }
      }, 1000);
    }, 1000);
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: theme.text }]}>HEADS OR TAILS?</Text>
      
      {flipping && (
        <View style={styles.resultContainer}>
          <Text style={[styles.spinningText, { color: theme.textMuted }]}>Flipping...</Text>
        </View>
      )}

      {result && !flipping && (
        <View style={styles.resultContainer}>
          <Text style={[styles.resultText, { color: theme.text }]}>
            {result}
          </Text>
        </View>
      )}

      {!flipping && !result && (
        <View style={styles.buttonsContainer}>
          <Pressable 
            style={[styles.button, { backgroundColor: theme.primary }]}
            onPress={() => handleChoice('HEADS')}
          >
            <Text style={styles.buttonText}>HEADS</Text>
          </Pressable>
          <Pressable 
            style={[styles.button, { backgroundColor: theme.primary }]}
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
  },
  title: {
    ...Typography.h2,
    marginBottom: Spacing.xxl,
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
    fontSize: 48,
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.xl,
  },
  button: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xxl,
    borderRadius: Radii.md,
  },
  buttonText: {
    ...Typography.h3,
    color: '#FFF',
  }
});
