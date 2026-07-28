export const rollDice = (): number => {
  return Math.floor(Math.random() * 6) + 1;
};

export const checkDiceWin = (roll: number, choice: 'HIGH' | 'LOW' | 'ODD' | 'EVEN'): boolean => {
  if (choice === 'HIGH') return roll >= 4;
  if (choice === 'LOW') return roll <= 3;
  if (choice === 'EVEN') return roll % 2 === 0;
  if (choice === 'ODD') return roll % 2 !== 0;
  return false;
};
