export type TowerRow = {
  dragonIndices: number[];
  revealed: boolean;
  selected?: number;
};

export const createTower = (rows: number = 7): TowerRow[] => {
  const tower: TowerRow[] = [];
  for (let i = 0; i < rows; i++) {
    // 1 safe path tile (egg) and 2 dragon tiles per row
    const safeIndex = Math.floor(Math.random() * 3);
    const dragonIndices = [0, 1, 2].filter((idx) => idx !== safeIndex);
    tower.push({
      dragonIndices,
      revealed: false,
    });
  }
  return tower;
};
