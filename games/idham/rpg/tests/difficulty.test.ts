import { test, expect } from 'vitest';
import { slimeSpeed, spawnInterval, slimeMode } from '../src/logic/difficulty';

test('slimeSpeed', () => {
  expect(slimeSpeed(0)).toBe(20);
  expect(slimeSpeed(10)).toBe(40);
  expect(slimeSpeed(100)).toBe(60);
});
test('spawnInterval', () => {
  expect(spawnInterval(0)).toBe(5);
  expect(spawnInterval(20)).toBeCloseTo(3);
  expect(spawnInterval(100)).toBe(1.5);
});
test('slimeMode', () => {
  expect(slimeMode(29.9)).toBe('wander');
  expect(slimeMode(30)).toBe('chase');
});
