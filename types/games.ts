export type GameResult = {
  won: boolean;
  gameId: string;
};

export interface AlarmGame {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export const GAMES: AlarmGame[] = [
  { id: 'mines', title: 'Mines', description: 'Tap and find 5 safe tiles', icon: '💣' },
  { id: 'dragon-tower', title: 'Dragon Tower', description: 'Tap and pick safe tile to climb', icon: '🐉' },
  { id: 'blackjack', title: 'Blackjack', description: 'Beat the dealer', icon: '🃏' },
  { id: 'roulette', title: 'Roulette', description: 'Pick red or black', icon: '🔴' },
  { id: 'dice', title: 'Dice', description: 'Predict high or low', icon: '🎲' },
  { id: 'higher-lower', title: 'Higher / Lower', description: 'Predict the next card', icon: '🃏' },
  { id: 'coin-flip', title: 'Coin Flip', description: 'Heads or tails', icon: '🪙' },
  { id: 'card-guess', title: 'Card Guess', description: 'Guess red or black', icon: '❓' },
];

export type GameSession = {
  id: string;
  gameId: string;
  alarmId: string;
  startedAt: number;
  result?: "win" | "loss";
};

