import { ROOM_COLS, ROOM_ROWS } from '../config/game';

export type Tile = { col: number; row: number };

const MIN_DIST = 4;

export function pickCoinTile(rng: () => number, hero: Tile, occupied: Tile[]): Tile | null {
  const candidates: Tile[] = [];
  for (let col = 1; col <= ROOM_COLS - 2; col++) {
    for (let row = 1; row <= ROOM_ROWS - 2; row++) {
      if (Math.max(Math.abs(col - hero.col), Math.abs(row - hero.row)) < MIN_DIST) continue;
      if (occupied.some((o) => o.col === col && o.row === row)) continue;
      candidates.push({ col, row });
    }
  }
  if (candidates.length === 0) return null;
  return candidates[Math.min(candidates.length - 1, Math.floor(rng() * candidates.length))] ?? null;
}
