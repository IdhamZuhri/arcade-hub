import { test, expect } from 'vitest';
import { fighterFrame } from '../src/logic/anim';

const base = { blocking: false, punchT: -1, moving: false, animT: 0 };

test('idle alternates', () => {
  expect(fighterFrame(base)).toBe('idle-0');
  expect(fighterFrame({ ...base, animT: 0.5 })).toBe('idle-1');
});

test('walk alternates faster', () => {
  expect(fighterFrame({ ...base, moving: true, animT: 0.2 })).toBe('walk-1');
});

test('punch frames follow the phase', () => {
  expect(fighterFrame({ ...base, punchT: 0.05 })).toBe('punch-0');
  expect(fighterFrame({ ...base, punchT: 0.15 })).toBe('punch-1');
  expect(fighterFrame({ ...base, punchT: 0.3 })).toBe('punch-1');
});

test('block shows the guard frame', () => {
  expect(fighterFrame({ ...base, blocking: true })).toBe('block');
});
