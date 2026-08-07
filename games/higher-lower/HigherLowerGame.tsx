import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Colors, Typography, Spacing, Radii, UI } from '../../constants/theme';
import PlayingCard from '../../components/PlayingCard';
import { setupHigherLower, checkHigherLowerWin } from './higherLowerEngine';
import { Card } from '../blackjack/blackjackEngine';

interface GameProps {
  onWin: () => void;
  onLose: () => void;
}

export default function HigherLowerGame({ onWin, onLose }: GameProps) {
  const [currentCard, setCurrentCard] = useState<Card | null>(null);
  const [nextCard, setNextCard] = useState<Card | null>(null);
  const [gameState, setGameState] = useState<'IDLE' | 'PLAYING' | 'REVEALING' | 'RESULT'>('IDLE');
  const [won, setWon] = useState(false);

  useEffect(() => {
    const { currentCard, nextCard } = setupHigherLower();
    setCurrentCard(currentCard);
    setNextCard(nextCard);
    setGameState('PLAYING');
  }, []);

  const handleChoice = (choice: 'HIGHER' | 'LOWER') => {
    if (gameState !== 'PLAYING' || !currentCard || !nextCard) return;
    
    setGameState('REVEALING');
    
    setTimeout(() => {
      const isWin = checkHigherLowerWin(currentCard, nextCard, choice);
      setWon(isWin);
      setGameState('RESULT');
      
      setTimeout(() => {
        if (isWin) {
          onWin();
        } else {
          onLose();
        }
      }, 1000);
    }, 800); // Quick slide/reveal animation delay
  };

  if (!currentCard) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>HIGHER OR LOWER</Text>
      </View>

      <View style={styles.playArea}>
        <View style={styles.cardSection}>
          <Text style={styles.sectionLabel}>CURRENT CARD</Text>
          <PlayingCard rank={currentCard.rank} suit={currentCard.suit} />
        </View>

        <View style={styles.cardSection}>
          <Text style={styles.sectionLabel}>NEXT CARD</Text>
          <PlayingCard 
            rank={nextCard?.rank || 'A'} 
            suit={nextCard?.suit || 'hearts'} 
            faceUp={gameState === 'REVEALING' || gameState === 'RESULT'} 
          />
        </View>
      </View>

      {gameState === 'RESULT' ? (
        <View style={styles.resultContainer}>
          <Text style={[styles.resultMain, { color: won ? Colors.dark.success : Colors.dark.danger }]}>
            {won ? 'YOU WIN 🎉' : currentCard.value === nextCard?.value ? 'SAME CARD' : 'YOU LOST'}
          </Text>
        </View>
      ) : (
        <View style={styles.controls}>
          <Pressable 
            style={styles.actionButton} 
            onPress={() => handleChoice('HIGHER')}
          >
            <Text style={styles.buttonText}>HIGHER</Text>
          </Pressable>
          <Pressable 
            style={styles.actionButton} 
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
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
    alignItems: 'center',
    justifyContent: 'space-evenly',
    backgroundColor: Colors.dark.background,
  },
  header: {
    alignItems: 'center',
    marginTop: 80,
  },
  headerTitle: {
    ...Typography.h2,
    color: Colors.dark.text,
    letterSpacing: 2,
  },
  playArea: {
    flex: 1,
    justifyContent: 'center',
    flexDirection: 'row',
    gap: Spacing.xl,
    width: '100%',
  },
  cardSection: {
    alignItems: 'center',
    gap: Spacing.md,
  },
  sectionLabel: {
    ...Typography.caption,
    color: Colors.dark.textMuted,
    letterSpacing: 1,
  },
  controls: {
    flexDirection: 'row',
    width: '100%',
    gap: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  actionButton: {
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
    ...Typography.bodyLarge,
    fontWeight: '700',
    color: '#000000',
  },
  resultContainer: {
    minHeight: UI.buttonHeight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  resultMain: {
    fontSize: 36,
    fontWeight: '800',
  },
});
