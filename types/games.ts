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
  { id: 'mines', title: 'Minesweeper', description: 'Tap and find 5 safe tiles', icon: '💣' },
  { id: 'dragon-tower', title: 'Tower Climb', description: 'Memorize the path and climb', icon: '🏰' },
  { id: 'lucky-race', title: 'Lucky Race', description: 'Pick your friendly racer', icon: '🏁' },
  { id: 'potion-mix', title: 'Potion Mix', description: 'Shake to mix a golden potion', icon: '⚗️' },
  { id: 'blackjack', title: 'Sundoku ☀️', description: 'Place 6 suns without touching', icon: '☀️' },
  { id: 'roulette', title: 'Color Wheel', description: 'Pick a color to spin', icon: '🎡' },
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

