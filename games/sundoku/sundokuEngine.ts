import puzzlesData from './sundokuPuzzles.json';

export interface SundokuPuzzle {
  id: string;
  regions: number[][]; // 6x6, values 0..5
  suns: number[]; // length 6, where suns[row] = col
}

// Pastel colors for the 6 regions (richer & darker for strong visual contrast)
export const REGION_COLORS = [
  '#FDBA74', // Rich Warm Peach
  '#7DD3FC', // Rich Sky Blue
  '#86EFAC', // Rich Mint Green
  '#C4B5FD', // Rich Lavender Violet
  '#FDE047', // Rich Sunny Yellow
  '#F9A8D4', // Rich Rose Pink
];

export const REGION_BORDER_COLORS = [
  '#F97316',
  '#0284C7',
  '#16A34A',
  '#7C3AED',
  '#CA8A04',
  '#DB2777',
];

// All 90 valid permutations of 6 non-touching queens on a 6x6 board
const ALL_VALID_SOLUTIONS: number[][] = (() => {
  const list: number[][] = [];
  function isValid(positions: number[]) {
    for (let r1 = 0; r1 < 6; r1++) {
      for (let r2 = r1 + 1; r2 < 6; r2++) {
        const c1 = positions[r1];
        const c2 = positions[r2];
        if (c1 === c2) return false;
        if (Math.abs(r1 - r2) <= 1 && Math.abs(c1 - c2) <= 1) return false;
      }
    }
    return true;
  }
  function permute(curr: number[], used: boolean[]) {
    if (curr.length === 6) {
      if (isValid(curr)) list.push([...curr]);
      return;
    }
    const r = curr.length;
    for (let c = 0; c < 6; c++) {
      if (!used[c]) {
        if (r > 0 && Math.abs(curr[r - 1] - c) <= 1) continue;
        used[c] = true;
        curr.push(c);
        permute(curr, used);
        curr.pop();
        used[c] = false;
      }
    }
  }
  permute([], [false, false, false, false, false, false]);
  return list;
})();

export function countSolutions(regions: number[][]): number {
  let count = 0;
  for (const sol of ALL_VALID_SOLUTIONS) {
    const regMask = new Uint8Array(6);
    let ok = true;
    for (let r = 0; r < 6; r++) {
      const reg = regions[r][sol[r]];
      if (regMask[reg]) {
        ok = false;
        break;
      }
      regMask[reg] = 1;
    }
    if (ok) {
      count++;
      if (count > 1) return count;
    }
  }
  return count;
}

export function areAllRegionsConnected(grid: number[][]): boolean {
  for (let reg = 0; reg < 6; reg++) {
    const cells: [number, number][] = [];
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 6; c++) {
        if (grid[r][c] === reg) cells.push([r, c]);
      }
    }
    if (cells.length === 0) return false;
    const visited = new Set<number>();
    const queue: [number, number][] = [cells[0]];
    visited.add(cells[0][0] * 6 + cells[0][1]);
    while (queue.length > 0) {
      const [cr, cc] = queue.shift()!;
      for (const [dr, dc] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
        const nr = cr + dr;
        const nc = cc + dc;
        if (nr >= 0 && nr < 6 && nc >= 0 && nc < 6 && grid[nr][nc] === reg) {
          const key = nr * 6 + nc;
          if (!visited.has(key)) {
            visited.add(key);
            queue.push([nr, nc]);
          }
        }
      }
    }
    if (visited.size !== cells.length) return false;
  }
  return true;
}

// Generate an on-the-fly puzzle or pick from the pre-generated verified catalogue
export function generateSundokuPuzzle(excludeId?: string): SundokuPuzzle {
  // Transformations: rotations (0, 90, 180, 270) and horizontal/vertical flips, and color region permutations
  const puzzles: { regions: number[][]; suns: number[] }[] = puzzlesData;
  const filtered = puzzles.filter((_, idx) => `p_${idx}` !== excludeId);
  const pool = filtered.length > 0 ? filtered : puzzles;
  const baseIndex = Math.floor(Math.random() * pool.length);
  const base = pool[baseIndex];

  // Random color permutation (shuffle 0..5 region ids)
  const perm = [0, 1, 2, 3, 4, 5].sort(() => Math.random() - 0.5);
  
  // Random horizontal or vertical flip
  const flipH = Math.random() > 0.5;
  const flipV = Math.random() > 0.5;

  const newRegions: number[][] = Array.from({ length: 6 }, () => new Array(6).fill(0));
  const newSuns: number[] = new Array(6).fill(0);

  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 6; c++) {
      const origR = flipV ? 5 - r : r;
      const origC = flipH ? 5 - c : c;
      newRegions[r][c] = perm[base.regions[origR][origC]];
    }
  }

  for (let r = 0; r < 6; r++) {
    const origR = flipV ? 5 - r : r;
    const origCol = base.suns[origR];
    const newCol = flipH ? 5 - origCol : origCol;
    newSuns[r] = newCol;
  }

  // Double check that it has exactly 1 solution and regions are connected
  if (countSolutions(newRegions) === 1 && areAllRegionsConnected(newRegions)) {
    return {
      id: `puzzle_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      regions: newRegions,
      suns: newSuns,
    };
  }

  // Fallback to base puzzle with clean region perm
  const safeRegions = base.regions.map(row => row.map(cell => perm[cell]));
  return {
    id: `puzzle_${Date.now()}_fallback`,
    regions: safeRegions,
    suns: base.suns,
  };
}

