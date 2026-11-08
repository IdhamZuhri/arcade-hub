import { test, expect } from 'vitest';
import { pickCoinTile, type Tile } from '../src/logic/spawn';
import { mulberry32 } from '../src/logic/rng';

const cheb = (a: Tile, b: Tile) => Math.max(Math.abs(a.col - b.col), Math.abs(a.row - b.row));

test('picks valid tiles', () => {
  const rng = mulberry32(1);
  const hero = { col: 5, row: 5 };
  const occupied = [{ col: 15, row: 5 }];
  for (let i = 0; i < 200; i++) {
    const t = pickCoinTile(rng, hero, occupied);
    expect(t).not.toBeNull();
    if (!t) continue;
    expect(t.col).toBeGreaterThanOrEqual(1);
    expect(t.col).toBeLessThanOrEqual(18);
    expect(t.row).toBeGreaterThanOrEqual(1);
    expect(t.row).toBeLessThanOrEqual(9);
    expect(cheb(t, hero)).toBeGreaterThanOrEqual(4);
    expect(occupied.some((o) => o.col === t.col && o.row === t.row)).toBe(false);
  }
});

test('returns null when no tile is available', () => {
  const hero = { col: 9, row: 5 };
  const occupied: Tile[] = [];
  for (let c = 1; c <= 18; c++)
    for (let r = 1; r <= 9; r++)
      if (cheb({ col: c, row: r }, hero) >= 4) occupied.push({ col: c, row: r });
  expect(pickCoinTile(mulberry32(3), hero, occupied)).toBeNull();
});

test('deterministic for a fixed seed', () => {
  const hero = { col: 9, row: 5 };
  expect(pickCoinTile(mulberry32(42), hero, [])).toEqual(pickCoinTile(mulberry32(42), hero, []));
});
