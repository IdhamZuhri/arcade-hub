import { test, expect } from 'vitest';
import { scoreForCoins } from '../src/logic/score';

test('scoreForCoins', () => {
  expect(scoreForCoins(0)).toBe(0);
  expect(scoreForCoins(7)).toBe(70);
});
