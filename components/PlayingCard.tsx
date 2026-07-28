import { View, Text, StyleSheet } from 'react-native';
import { Colors, Radii } from '../constants/theme';

export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';

type PlayingCardProps = {
  rank: string;
  suit: Suit;
  faceUp?: boolean;
};

const SUIT_SYMBOLS: Record<Suit, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};

const isRedSuit = (suit: Suit) => suit === 'hearts' || suit === 'diamonds';

export default function PlayingCard({ rank, suit, faceUp = true }: PlayingCardProps) {
  if (!faceUp) {
    return <CardBack />;
  }

  const symbol = SUIT_SYMBOLS[suit];
  const color = isRedSuit(suit) ? Colors.light.cardRed : Colors.light.cardDark;

  return (
    <View style={[styles.card, { backgroundColor: Colors.light.cardBackground }]}>
      {/* Top Left Rank */}
      <View style={styles.topLeft}>
        <Text style={[styles.rankText, { color }]}>{rank}</Text>
        <Text style={[styles.smallSuit, { color }]}>{symbol}</Text>
      </View>
      
      {/* Center Large Suit */}
      <View style={styles.center}>
        <Text style={[styles.largeSuit, { color }]}>{symbol}</Text>
      </View>

      {/* Bottom Right Rank (Rotated) */}
      <View style={styles.bottomRight}>
        <Text style={[styles.rankText, { color, transform: [{ rotate: '180deg' }] }]}>{rank}</Text>
        <Text style={[styles.smallSuit, { color, transform: [{ rotate: '180deg' }] }]}>{symbol}</Text>
      </View>
    </View>
  );
}

export function CardBack() {
  return (
    <View style={[styles.card, { backgroundColor: Colors.dark.surface, padding: 6 }]}>
      <View style={styles.cardBackInner}>
        <View style={styles.cardBackPattern}>
          <Text style={styles.cardBackPatternText}>◇ ◇ ◇</Text>
          <Text style={styles.cardBackPatternText}>◇ ◇ ◇</Text>
          <Text style={styles.cardBackPatternText}>◇ ◇ ◇</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 110, // Base width
    height: 157, // 0.70 : 1 proportion
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    position: 'relative',
    padding: 8,
  },
  topLeft: {
    position: 'absolute',
    top: 8,
    left: 8,
    alignItems: 'center',
  },
  bottomRight: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    alignItems: 'center',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankText: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 28,
  },
  smallSuit: {
    fontSize: 18,
    lineHeight: 20,
  },
  largeSuit: {
    fontSize: 64,
  },
  cardBackInner: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: Radii.sm - 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBackPattern: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  cardBackPatternText: {
    color: 'rgba(255,255,255,0.2)',
    fontSize: 16,
    letterSpacing: 4,
  }
});
