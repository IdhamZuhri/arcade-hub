import { test, expect } from 'vitest';
import { takeHit, tickHealth, isDead, type HeroHealth } from '../src/logic/health';

const fresh: HeroHealth = { hearts: 3, invuln: 0 };

test('hit removes a heart and grants invulnerability', () => {
  expect(takeHit(fresh)).toEqual({ hearts: 2, invuln: 1 });
});
test('no damage while invulnerable', () => {
  expect(takeHit({ hearts: 2, invuln: 0.5 }).hearts).toBe(2);
});
test('tick clamps invuln at 0', () => {
  expect(tickHealth({ hearts: 2, invuln: 1 }, 2).invuln).toBe(0);
});
test('three spaced hits kill', () => {
  let h = fresh;
  for (let i = 0; i < 3; i++) h = tickHealth(takeHit(h), 1);
  expect(isDead(h)).toBe(true);
  expect(isDead(fresh)).toBe(false);
});
