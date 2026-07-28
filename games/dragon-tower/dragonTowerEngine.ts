export type TowerRow = {
  dragonIndex: number;
  revealed: boolean;
  selected?: number;
};

export const createTower = (rows: number = 6): TowerRow[] => {
  const tower: TowerRow[] = [];
  for (let i = 0; i < rows; i++) {
    tower.push({
      dragonIndex: Math.floor(Math.random() * 3),
      revealed: false,
    });
  }
  return tower;
};
