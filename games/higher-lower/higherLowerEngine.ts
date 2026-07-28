import { Card, createDeck } from '../blackjack/blackjackEngine';

export const setupHigherLower = (): { currentCard: Card, nextCard: Card } => {
  const deck = createDeck();
  return {
    currentCard: deck[0],
    nextCard: deck[1],
  };
};

export const checkHigherLowerWin = (currentCard: Card, nextCard: Card, choice: 'HIGHER' | 'LOWER'): boolean => {
  if (currentCard.value === nextCard.value) return false;
  
  if (choice === 'HIGHER') return nextCard.value > currentCard.value;
  if (choice === 'LOWER') return nextCard.value < currentCard.value;
  
  return false;
};
