import { test, expect } from 'vitest';
import { matchScore } from '../src/logic/score';

test('matchScore', () => {
  expect(matchScore(150, [12.9, 0.5])).toBe(374);
});
