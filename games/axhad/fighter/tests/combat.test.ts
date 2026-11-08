import { test, expect } from 'vitest';
import { resolveHit } from '../src/logic/combat';

test('resolveHit', () => {
  expect(resolveHit(100, false)).toEqual({ hp: 90, dealt: 10 });
  expect(resolveHit(100, true)).toEqual({ hp: 98, dealt: 2 });
  expect(resolveHit(5, false)).toEqual({ hp: 0, dealt: 5 });
});
