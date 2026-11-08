import { test, expect } from 'vitest';
import { mulberry32 } from '../src/logic/rng';

const take = (seed: number) => {
  const r = mulberry32(seed);
  return Array.from({ length: 5 }, () => r());
};
test('same seed gives same sequence', () => {
  expect(take(42)).toEqual(take(42));
});
test('different seeds differ', () => {
  expect(take(1)).not.toEqual(take(2));
});
test('values are in [0, 1)', () => {
  const r = mulberry32(7);
  for (let i = 0; i < 1000; i++) {
    const v = r();
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThan(1);
  }
});
