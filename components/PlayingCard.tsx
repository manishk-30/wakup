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
    <View style={[styles.card, { backgroundColor: '#FFFFFF', padding: 4 }]}>
      <View style={[styles.cardBackInner, { backgroundColor: Colors.light.text, borderColor: Colors.light.primary }]}>
        
        {/* Background Pattern */}
        <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center' }]}>
          <View style={{flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', width: '120%', opacity: 0.15}}>
             {Array.from({length: 35}).map((_, i) => (
                <Text key={i} style={{color: Colors.light.primary, fontSize: 14, margin: 4}}>◈</Text>
             ))}
          </View>
        </View>

        {/* Center Medallion */}
        <View style={styles.medallion}>
          <View style={styles.medallionInner}>
            <Text style={styles.medallionText}>W</Text>
          </View>
        </View>

        {/* Corner Accents */}
        <Text style={[styles.cornerAccent, { top: 4, left: 4 }]}>☀</Text>
        <Text style={[styles.cornerAccent, { top: 4, right: 4 }]}>☀</Text>
        <Text style={[styles.cornerAccent, { bottom: 4, left: 4 }]}>☀</Text>
        <Text style={[styles.cornerAccent, { bottom: 4, right: 4 }]}>☀</Text>
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
    borderWidth: 2,
    borderRadius: Radii.sm - 2,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  medallion: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.text,
  },
  medallionInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 176, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  medallionText: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.light.primary,
    fontStyle: 'italic',
  },
  cornerAccent: {
    position: 'absolute',
    fontSize: 10,
    color: Colors.light.primary,
  }
});
