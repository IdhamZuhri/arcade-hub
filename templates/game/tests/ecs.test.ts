import { test, expect } from 'vitest';
import { World } from '../src/logic/ecs';

test('query returns only entities with all components', () => {
  const w = new World();
  const a = w.spawn({ position: { x: 0, y: 0 }, velocity: { x: 1, y: 1 } });
  w.spawn({ position: { x: 0, y: 0 } });
  const r = w.query('position', 'velocity');
  expect(r.map((e) => e.id)).toEqual([a.id]);
});
test('remove drops the entity', () => {
  const w = new World();
  const a = w.spawn({ position: { x: 0, y: 0 } });
  w.remove(a.id);
  expect(w.query('position')).toHaveLength(0);
});
test('ids are unique and increasing', () => {
  const w = new World();
  const a = w.spawn({});
  const b = w.spawn({});
  expect(b.id).toBeGreaterThan(a.id);
});
