import type { Vec2 } from './movement';

export function wanderVelocity(rng: () => number, speed: number): Vec2 {
  const angle = (Math.floor(rng() * 8) % 8) * (Math.PI / 4);
  const x = Math.round(Math.cos(angle));
  const y = Math.round(Math.sin(angle));
  const len = Math.hypot(x, y);
  return { x: (x / len) * speed, y: (y / len) * speed };
}

export function chaseVelocity(from: Vec2, to: Vec2, speed: number): Vec2 {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy);
  if (len === 0) return { x: 0, y: 0 };
  return { x: (dx / len) * speed, y: (dy / len) * speed };
}
