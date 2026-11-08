import { test, expect, vi } from 'vitest';
import { Pool } from '../src/logic/pool';

test('acquire returns null beyond max', () => {
  const p = new Pool(
    () => ({}),
    () => {},
    2,
  );
  expect(p.acquire()).not.toBeNull();
  expect(p.acquire()).not.toBeNull();
  expect(p.acquire()).toBeNull();
});
test('release resets and reuses the same object', () => {
  const reset = vi.fn();
  const p = new Pool(() => ({ n: 1 }), reset, 1);
  const a = p.acquire()!;
  p.release(a);
  expect(reset).toHaveBeenCalledWith(a);
  expect(p.acquire()).toBe(a);
});
test('activeCount tracks acquired items', () => {
  const p = new Pool(
    () => ({}),
    () => {},
    3,
  );
  const a = p.acquire()!;
  p.acquire();
  expect(p.activeCount).toBe(2);
  p.release(a);
  expect(p.activeCount).toBe(1);
});
