import { test, expect } from 'vitest';
import { wanderVelocity, chaseVelocity } from '../src/logic/ai';
import { mulberry32 } from '../src/logic/rng';

test('wander is one of 8 directions with length speed', () => {
  const rng = mulberry32(7);
  const d = 10 / Math.SQRT2;
  for (let i = 0; i < 100; i++) {
    const v = wanderVelocity(rng, 10);
    expect(Math.hypot(v.x, v.y)).toBeCloseTo(10);
    for (const c of [v.x, v.y]) {
      expect(
        [0, 10, -10].some((a) => Math.abs(c - a) < 1e-9) || Math.abs(Math.abs(c) - d) < 1e-9,
      ).toBe(true);
    }
  }
});
test('chase', () => {
  const v = chaseVelocity({ x: 0, y: 0 }, { x: 3, y: 4 }, 10);
  expect(v.x).toBeCloseTo(6);
  expect(v.y).toBeCloseTo(8);
  expect(chaseVelocity({ x: 2, y: 2 }, { x: 2, y: 2 }, 10)).toEqual({ x: 0, y: 0 });
});
