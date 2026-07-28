import { Suit } from '../../components/PlayingCard';

export type Card = {
  rank: string;
  suit: Suit;
  value: number;
};

export const createDeck = (): Card[] => {
  const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
  const ranks = [
    { rank: '2', value: 2 },
    { rank: '3', value: 3 },
    { rank: '4', value: 4 },
    { rank: '5', value: 5 },
    { rank: '6', value: 6 },
    { rank: '7', value: 7 },
    { rank: '8', value: 8 },
    { rank: '9', value: 9 },
    { rank: '10', value: 10 },
    { rank: 'J', value: 10 },
    { rank: 'Q', value: 10 },
    { rank: 'K', value: 10 },
    { rank: 'A', value: 11 },
  ];

  let deck: Card[] = [];
  suits.forEach(suit => {
    ranks.forEach(r => {
      deck.push({ rank: r.rank, suit, value: r.value });
    });
  });
  
  // Shuffle
  return deck.sort(() => Math.random() - 0.5);
};

export const calculateScore = (hand: Card[]): number => {
  let score = 0;
  let aces = 0;
  
  hand.forEach(card => {
    score += card.value;
    if (card.rank === 'A') aces += 1;
  });

  while (score > 21 && aces > 0) {
    score -= 10;
    aces -= 1;
  }

  return score;
};
