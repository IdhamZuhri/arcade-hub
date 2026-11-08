import { test, expect } from 'vitest';
import { separate } from '../src/logic/arena';

test('non-overlapping fighters are untouched', () => {
  expect(separate(50, 200, 24)).toEqual({ a: 50, b: 200 });
});

test('overlap is split evenly', () => {
  const r = separate(100, 110, 24);
  expect(r.b - r.a).toBeCloseTo(24);
  expect(r.a + r.b).toBeCloseTo(210);
});

test('works when a is right of b', () => {
  const r = separate(110, 100, 24);
  expect(r.a - r.b).toBeCloseTo(24);
});

test('stays on screen against the left wall', () => {
  const r = separate(0, 5, 24);
  expect(r.a).toBeGreaterThanOrEqual(0);
  expect(r.b - r.a).toBeCloseTo(24);
});

test('stays on screen against the right wall', () => {
  const r = separate(290, 296, 24);
  expect(r.b).toBeLessThanOrEqual(296);
  expect(r.b - r.a).toBeCloseTo(24);
});

test('clamps off-screen positions', () => {
  expect(separate(-10, 400, 24)).toEqual({ a: 0, b: 296 });
});
