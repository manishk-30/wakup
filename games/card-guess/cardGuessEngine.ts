import { createDeck, Card } from '../blackjack/blackjackEngine';

export const setupCardGuess = (): Card => {
  const deck = createDeck();
  return deck[0];
};

export const checkCardGuessWin = (card: Card, choice: 'RED' | 'BLACK'): boolean => {
  const isRed = card.suit === 'hearts' || card.suit === 'diamonds';
  if (choice === 'RED') return isRed;
  if (choice === 'BLACK') return !isRed;
  return false;
};
