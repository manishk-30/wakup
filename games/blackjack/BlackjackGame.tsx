import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Colors, Typography, Spacing, Radii, UI } from '../../constants/theme';
import PlayingCard from '../../components/PlayingCard';
import { createDeck, calculateScore, Card } from './blackjackEngine';

interface GameProps {
  onWin: () => void;
  onLose: () => void;
}

export default function BlackjackGame({ onWin, onLose }: GameProps) {
  const [deck, setDeck] = useState<Card[]>([]);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [dealerHand, setDealerHand] = useState<Card[]>([]);
  const [gameState, setGameState] = useState<'PLAYING' | 'PLAYER_BUST' | 'DEALER_TURN' | 'RESULT'>('PLAYING');
  const [resultMessage, setResultMessage] = useState('');
  const [won, setWon] = useState(false);

  useEffect(() => {
    startNewGame();
  }, []);

  const startNewGame = () => {
    const newDeck = createDeck();
    setPlayerHand([newDeck[0], newDeck[2]]);
    setDealerHand([newDeck[1], newDeck[3]]);
    setDeck(newDeck.slice(4));
    setGameState('PLAYING');
  };

  const handleHit = () => {
    if (gameState !== 'PLAYING') return;
    
    const newCard = deck[0];
    const newHand = [...playerHand, newCard];
    setPlayerHand(newHand);
    setDeck(deck.slice(1));

    if (calculateScore(newHand) > 21) {
      setGameState('PLAYER_BUST');
      endGame(false, 'BUST');
    }
  };

  const handleStand = () => {
    if (gameState !== 'PLAYING') return;
    setGameState('DEALER_TURN');
    
    let currentDealerHand = [...dealerHand];
    let currentDeck = [...deck];
    
    // Dealer draws until at least 17
    while (calculateScore(currentDealerHand) < 17) {
      currentDealerHand.push(currentDeck[0]);
      currentDeck = currentDeck.slice(1);
    }
    
    setDealerHand(currentDealerHand);
    setDeck(currentDeck);
    
    const playerScore = calculateScore(playerHand);
    const dealerScore = calculateScore(currentDealerHand);
    
    if (dealerScore > 21) {
      endGame(true, `${playerScore} vs BUST`);
    } else if (playerScore > dealerScore) {
      endGame(true, `${playerScore} vs ${dealerScore}`);
    } else if (playerScore < dealerScore) {
      endGame(false, `${dealerScore} vs ${playerScore}`);
    } else {
      endGame(false, 'PUSH'); // Tie is a loss
    }
  };

  const endGame = (isWin: boolean, message: string) => {
    setGameState('RESULT');
    setResultMessage(message);
    setWon(isWin);
    
    setTimeout(() => {
      if (isWin) {
        onWin();
      } else {
        onLose();
      }
    }, 1000); // Give user time to see result before parent takes over
  };

  const playerScore = calculateScore(playerHand);
  const showDealerHiddenCard = gameState !== 'PLAYING';
  const dealerScoreVisible = showDealerHiddenCard ? calculateScore(dealerHand) : '?';

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>BLACKJACK</Text>

      <View style={styles.playArea}>
        {/* Dealer Area */}
        <View style={styles.handContainer}>
          <Text style={styles.handTitle}>DEALER</Text>
          <View style={styles.cardsRow}>
            {dealerHand.map((card, idx) => (
              <View key={`dealer-${idx}`} style={[styles.cardWrapper, { marginLeft: idx > 0 ? -70 : 0 }]}>
                <PlayingCard 
                  rank={card.rank} 
                  suit={card.suit} 
                  faceUp={idx === 0 || showDealerHiddenCard} 
                />
              </View>
            ))}
          </View>
          {showDealerHiddenCard && <Text style={styles.scoreText}>{dealerScoreVisible}</Text>}
        </View>

        {/* Player Area */}
        <View style={[styles.handContainer, { marginTop: Spacing.xxl }]}>
          <Text style={styles.handTitle}>YOU</Text>
          <View style={styles.cardsRow}>
            {playerHand.map((card, idx) => (
              <View key={`player-${idx}`} style={[styles.cardWrapper, { marginLeft: idx > 0 ? -70 : 0 }]}>
                <PlayingCard rank={card.rank} suit={card.suit} />
              </View>
            ))}
          </View>
          <Text style={styles.scoreText}>{playerScore}</Text>
        </View>
      </View>

      {gameState === 'PLAYING' ? (
        <View style={styles.controls}>
          <Pressable style={[styles.actionButton, { backgroundColor: Colors.dark.primary }]} onPress={handleHit}>
            <Text style={styles.buttonText}>HIT</Text>
          </Pressable>
          <Pressable style={[styles.actionButton, { backgroundColor: Colors.dark.surface, borderWidth: 1, borderColor: Colors.dark.border }]} onPress={handleStand}>
            <Text style={[styles.buttonText, { color: Colors.dark.text }]}>STAND</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.resultContainer}>
          <Text style={[styles.resultMain, { color: won ? Colors.dark.success : Colors.dark.danger }]}>
            {won ? 'YOU WIN 🎉' : gameState === 'PLAYER_BUST' ? 'BUST' : 'YOU LOST'}
          </Text>
          <Text style={styles.resultSub}>{resultMessage}</Text>
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
    justifyContent: 'space-evenly', // Better distribution on small screens
  },
  headerTitle: {
    ...Typography.h2,
    color: Colors.dark.text,
    letterSpacing: 2,
  },
  playArea: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.md, // Add gap between player and dealer sections
    width: '100%',
  },
  handContainer: {
    alignItems: 'center',
  },
  handTitle: {
    ...Typography.caption,
    color: Colors.dark.textMuted,
    marginBottom: Spacing.sm,
    letterSpacing: 1,
  },
  cardsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  cardWrapper: {
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  scoreText: {
    ...Typography.h3,
    color: Colors.dark.text,
    marginTop: Spacing.sm,
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
  },
  buttonText: {
    ...Typography.bodyLarge,
    fontWeight: '700',
    color: '#FFF',
  },
  resultContainer: {
    paddingBottom: Spacing.xl,
    alignItems: 'center',
  },
  resultMain: {
    fontSize: 36,
    fontWeight: '800',
    marginBottom: Spacing.xs,
  },
  resultSub: {
    ...Typography.bodyLarge,
    color: Colors.dark.textMuted,
  }
});
