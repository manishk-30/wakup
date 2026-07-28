import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Colors, Typography, Spacing, Radii, UI } from '../../constants/theme';
import PlayingCard from '../../components/PlayingCard';
import { setupCardGuess, checkCardGuessWin } from './cardGuessEngine';
import { Card } from '../blackjack/blackjackEngine';

interface GameProps {
  onWin: () => void;
  onLose: () => void;
}

export default function CardGuessGame({ onWin, onLose }: GameProps) {
  const [card, setCard] = useState<Card | null>(null);
  const [gameState, setGameState] = useState<'PLAYING' | 'REVEALING' | 'RESULT'>('PLAYING');
  const [won, setWon] = useState(false);

  useEffect(() => {
    setCard(setupCardGuess());
    setGameState('PLAYING');
  }, []);

  const handleChoice = (choice: 'RED' | 'BLACK') => {
    if (gameState !== 'PLAYING' || !card) return;
    
    setGameState('REVEALING');
    
    setTimeout(() => {
      const isWin = checkCardGuessWin(card, choice);
      setWon(isWin);
      setGameState('RESULT');
      
      setTimeout(() => {
        if (isWin) {
          onWin();
        } else {
          onLose();
        }
      }, 1000);
    }, 800); // 0.8s reveal duration
  };

  if (!card) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>CARD GUESS</Text>
      <Text style={styles.subtitle}>What color is the card?</Text>
      
      <View style={styles.cardContainer}>
        <PlayingCard 
          rank={card.rank} 
          suit={card.suit} 
          faceUp={gameState === 'REVEALING' || gameState === 'RESULT'} 
        />
      </View>

      {gameState === 'RESULT' ? (
        <View style={styles.resultContainer}>
          <Text style={[styles.resultText, { color: won ? Colors.dark.success : Colors.dark.danger }]}>
            {won ? 'YOU WIN 🎉' : 'YOU LOST'}
          </Text>
        </View>
      ) : (
        <View style={styles.buttonsContainer}>
          <Pressable 
            style={[styles.button, { backgroundColor: Colors.dark.danger }]}
            onPress={() => handleChoice('RED')}
          >
            <Text style={styles.buttonText}>RED</Text>
          </Pressable>
          <Pressable 
            style={[styles.button, { backgroundColor: '#111827' }]}
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
    paddingTop: Spacing.xxl,
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
    marginTop: Spacing.sm,
  },
  cardContainer: {
    marginVertical: Spacing.xxl,
  },
  resultContainer: {
    height: UI.buttonHeight,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  resultText: {
    ...Typography.h1,
    fontSize: 40,
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
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
