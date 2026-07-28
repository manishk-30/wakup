export const spinRoulette = (): 'RED' | 'BLACK' => {
  return Math.random() > 0.5 ? 'RED' : 'BLACK';
};
