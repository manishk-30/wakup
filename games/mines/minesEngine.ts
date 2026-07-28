export type MineTile = {
  id: number;
  isMine: boolean;
  isRevealed: boolean;
};

export const createMinesGrid = (): MineTile[] => {
  const tiles: MineTile[] = Array.from({ length: 16 }).map((_, i) => ({
    id: i,
    isMine: false,
    isRevealed: false,
  }));
  
  // Place 7 mines to keep density similar to 4/9
  let minesPlaced = 0;
  while (minesPlaced < 7) {
    const idx = Math.floor(Math.random() * 16);
    if (!tiles[idx].isMine) {
      tiles[idx].isMine = true;
      minesPlaced++;
    }
  }
  
  return tiles;
};
