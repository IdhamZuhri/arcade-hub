import { test, expect } from 'vitest';
import { decideCpu, blockChance, reactionTime } from '../src/logic/cpu';

const rng = (v: number) => () => v;

test('decideCpu', () => {
  expect(decideCpu({ distance: 20, playerPunching: false, canAct: false }, rng(0.1), 1)).toBe(
    'idle',
  );
  const p = { distance: 100, playerPunching: true, canAct: true };
  expect(decideCpu(p, rng(0.1), 1)).toBe('block');
  expect(decideCpu(p, rng(0.5), 1)).not.toBe('block');
  const near = { distance: 20, playerPunching: false, canAct: true };
  expect(decideCpu(near, rng(0.5), 1)).toBe('punch');
  expect(decideCpu(near, rng(0.7), 1)).toBe('idle');
  expect(decideCpu({ distance: 100, playerPunching: false, canAct: true }, rng(0.5), 1)).toBe(
    'approach',
  );
});

test('level scaling', () => {
  expect(blockChance(1)).toBeCloseTo(0.3);
  expect(blockChance(10)).toBe(0.75);
  expect(reactionTime(1)).toBeCloseTo(0.35);
  expect(reactionTime(10)).toBe(0.15);
});
