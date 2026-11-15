export type WheelColor = 'RED' | 'BLUE' | 'GREEN' | 'YELLOW';

export const WHEEL_COLORS: WheelColor[] = ['RED', 'BLUE', 'GREEN', 'YELLOW'];

export const spinRoulette = (): WheelColor => {
  const randomIndex = Math.floor(Math.random() * WHEEL_COLORS.length);
  return WHEEL_COLORS[randomIndex];
};
