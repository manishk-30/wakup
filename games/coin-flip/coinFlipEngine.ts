export const flipCoin = (): 'HEADS' | 'TAILS' => {
  return Math.random() > 0.5 ? 'HEADS' : 'TAILS';
};
