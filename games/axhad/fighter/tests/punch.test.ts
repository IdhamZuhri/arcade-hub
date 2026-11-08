import { test, expect } from 'vitest';
import { punchPhase, punchHitbox, canLand, isThreatening } from '../src/logic/punch';

test('punchPhase', () => {
  expect(punchPhase(0)).toBe('startup');
  expect(punchPhase(0.1)).toBe('active');
  expect(punchPhase(0.199)).toBe('active');
  expect(punchPhase(0.2)).toBe('recovery');
  expect(punchPhase(0.4)).toBe('done');
});

test('canLand', () => {
  expect(canLand('active', false)).toBe(true);
  expect(canLand('active', true)).toBe(false);
  expect(canLand('startup', false)).toBe(false);
});

test('punchHitbox', () => {
  expect(punchHitbox(100, 50, 1)).toEqual({ x: 124, y: 60, w: 16, h: 8 });
  expect(punchHitbox(100, 50, -1)).toEqual({ x: 84, y: 60, w: 16, h: 8 });
});

test('isThreatening is false when idle and during recovery', () => {
  expect(isThreatening(-1)).toBe(false);
  expect(isThreatening(0.05)).toBe(true);
  expect(isThreatening(0.15)).toBe(true);
  expect(isThreatening(0.25)).toBe(false);
});
