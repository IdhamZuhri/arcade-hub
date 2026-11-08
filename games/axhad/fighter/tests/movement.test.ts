import { test, expect } from 'vitest';
import { clampDt, step, inputToVelocity, clampToBounds } from '../src/logic/movement';

test('clampDt converts ms to seconds and caps at 0.1', () => {
  expect(clampDt(16)).toBeCloseTo(0.016);
  expect(clampDt(1000)).toBe(0.1);
  expect(clampDt(-5)).toBe(0);
});

test('step integrates velocity', () => {
  expect(step({ x: 0, y: 0 }, { x: 10, y: -20 }, 0.5)).toEqual({ x: 5, y: -10 });
});

test('inputToVelocity normalises diagonals', () => {
  const v = inputToVelocity(1, 1, 100);
  expect(Math.hypot(v.x, v.y)).toBeCloseTo(100);
  expect(inputToVelocity(0, 0, 100)).toEqual({ x: 0, y: 0 });
  expect(inputToVelocity(-1, 0, 50)).toEqual({ x: -50, y: 0 });
});

test('clampToBounds keeps pos + size inside bounds', () => {
  const bounds = { x: 0, y: 0, w: 320, h: 180 };
  const size = { x: 12, y: 12 };
  expect(clampToBounds({ x: 400, y: 400 }, size, bounds)).toEqual({ x: 308, y: 168 });
  expect(clampToBounds({ x: -5, y: -5 }, size, bounds)).toEqual({ x: 0, y: 0 });
});

test('a huge frame cannot tunnel: at most 200px at 2000px/s', () => {
  const p = step({ x: 0, y: 0 }, { x: 2000, y: 0 }, clampDt(1000));
  expect(p.x).toBeLessThanOrEqual(200);
});
