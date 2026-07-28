import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, useColorScheme } from 'react-native';
import { Colors, Typography, Spacing, Radii } from '../../constants/theme';

interface GameProps {
  onWin: () => void;
  onLose: () => void;
}

export default function Roulette({ onWin, onLose }: GameProps) {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
  
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<'RED' | 'BLACK' | null>(null);

  const handleChoice = (choice: 'RED' | 'BLACK') => {
    if (spinning) return;
    setSpinning(true);
    
    // Simulate short spin
    setTimeout(() => {
      const outcome = Math.random() > 0.5 ? 'RED' : 'BLACK';
      setResult(outcome);
      setSpinning(false);
      
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
      <Text style={[styles.title, { color: theme.text }]}>RED OR BLACK?</Text>
      
      {spinning && (
        <View style={styles.resultContainer}>
          <Text style={[styles.spinningText, { color: theme.textMuted }]}>Spinning...</Text>
        </View>
      )}

      {result && !spinning && (
        <View style={styles.resultContainer}>
          <Text style={[
            styles.resultText, 
            { color: result === 'RED' ? theme.danger : (colorScheme === 'dark' ? '#FFF' : '#000') }
          ]}>
            {result}
          </Text>
        </View>
      )}

      {!spinning && !result && (
        <View style={styles.buttonsContainer}>
          <Pressable 
            style={[styles.button, { backgroundColor: theme.danger }]}
            onPress={() => handleChoice('RED')}
          >
            <Text style={styles.buttonText}>RED</Text>
          </Pressable>
          <Pressable 
            style={[styles.button, { backgroundColor: '#111827' }]} // Always dark for black choice
            onPress={() => handleChoice('BLACK')}
          >
            <Text style={styles.buttonText}>BLACK</Text>
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
    fontSize: 64,
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
