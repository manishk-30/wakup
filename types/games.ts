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
  { id: 'blackjack', title: 'Blackjack', description: 'Beat the dealer', icon: '🃏' },
  { id: 'dragon-tower', title: 'Dragon Tower', description: 'Pick safe tiles to climb', icon: '🐉' },
  { id: 'mines', title: 'Mines', description: 'Find 4 safe tiles', icon: '💣' },
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

