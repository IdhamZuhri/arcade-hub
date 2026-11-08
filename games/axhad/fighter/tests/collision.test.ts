import { test, expect } from 'vitest';
import { overlaps } from '../src/logic/collision';

test('intersecting rects overlap', () => {
  expect(overlaps({ x: 0, y: 0, w: 10, h: 10 }, { x: 5, y: 5, w: 10, h: 10 })).toBe(true);
});
test('edge-touching rects do not overlap', () => {
  expect(overlaps({ x: 0, y: 0, w: 10, h: 10 }, { x: 10, y: 0, w: 10, h: 10 })).toBe(false);
  expect(overlaps({ x: 0, y: 0, w: 10, h: 10 }, { x: 0, y: 10, w: 10, h: 10 })).toBe(false);
});
test('containment overlaps', () => {
  expect(overlaps({ x: 0, y: 0, w: 100, h: 100 }, { x: 10, y: 10, w: 5, h: 5 })).toBe(true);
});
