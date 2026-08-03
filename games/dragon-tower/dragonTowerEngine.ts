export type TowerRow = {
  dragonIndices: number[];
  revealed: boolean;
  selected?: number;
};

export const createTower = (rows: number = 7): TowerRow[] => {
  const tower: TowerRow[] = [];
  
  // Pick 2 unique rows to be the hard rows
  const hardRowIndices = new Set<number>();
  while (hardRowIndices.size < 2) {
    hardRowIndices.add(Math.floor(Math.random() * rows));
  }

  for (let i = 0; i < rows; i++) {
    if (hardRowIndices.has(i)) {
      // Hard row: 2 dragons
      const firstDragon = Math.floor(Math.random() * 3);
      let secondDragon = Math.floor(Math.random() * 3);
      while (secondDragon === firstDragon) {
        secondDragon = Math.floor(Math.random() * 3);
      }
      tower.push({
        dragonIndices: [firstDragon, secondDragon],
        revealed: false,
      });
    } else {
      // Normal row: 1 dragon
      tower.push({
        dragonIndices: [Math.floor(Math.random() * 3)],
        revealed: false,
      });
    }
  }
  return tower;
};
