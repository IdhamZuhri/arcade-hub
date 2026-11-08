import { test, expect } from 'vitest';
import { highScoreKey, loadHighScore, recordScore, saveHighScore } from '../src/storage';

const mem = (init: Record<string, string> = {}) => {
  const d = { ...init };
  return {
    getItem: (k: string) => d[k] ?? null,
    setItem: (k: string, v: string) => {
      d[k] = v;
    },
    d,
  };
};
const throwing = {
  getItem: () => {
    throw new Error('denied');
  },
  setItem: () => {
    throw new Error('quota');
  },
};
test('key format', () => expect(highScoreKey('idham-rpg')).toBe('arcade:idham-rpg:highscore'));
test('missing → 0', () => expect(loadHighScore('g', mem())).toBe(0));
test.each([
  ['NaN', 0],
  ['-5', 0],
  ['1e400', 0],
  ['abc', 0],
  ['12.7', 12],
  ['40', 40],
])('stored %s → %d', (raw, want) =>
  expect(loadHighScore('g', mem({ 'arcade:g:highscore': raw }))).toBe(want),
);
test('throwing storage → 0, save is a no-op', () => {
  expect(loadHighScore('g', throwing)).toBe(0);
  expect(() => saveHighScore('g', 5, throwing)).not.toThrow();
});
test('no storage available (undefined) → 0', () => expect(loadHighScore('g', undefined)).toBe(0));
test('recordScore only saves a new best', () => {
  const s = mem({ 'arcade:g:highscore': '50' });
  expect(recordScore('g', 30, s)).toEqual({ best: 50, isNew: false });
  expect(recordScore('g', 70, s)).toEqual({ best: 70, isNew: true });
  expect(s.d['arcade:g:highscore']).toBe('70');
});
