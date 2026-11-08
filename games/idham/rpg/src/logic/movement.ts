export type Vec2 = { x: number; y: number };
export type Rect = { x: number; y: number; w: number; h: number };

/** Milliseconds to seconds, capped so a backgrounded tab cannot cause a huge step. */
export function clampDt(deltaMs: number): number {
  return Math.min(Math.max(deltaMs, 0) / 1000, 0.1);
}

export function step(pos: Vec2, vel: Vec2, dt: number): Vec2 {
  return { x: pos.x + vel.x * dt, y: pos.y + vel.y * dt };
}

export function inputToVelocity(dx: -1 | 0 | 1, dy: -1 | 0 | 1, speed: number): Vec2 {
  const len = Math.hypot(dx, dy);
  if (len === 0) return { x: 0, y: 0 };
  return { x: (dx / len) * speed, y: (dy / len) * speed };
}

export function clampToBounds(pos: Vec2, size: Vec2, bounds: Rect): Vec2 {
  return {
    x: Math.min(Math.max(pos.x, bounds.x), bounds.x + bounds.w - size.x),
    y: Math.min(Math.max(pos.y, bounds.y), bounds.y + bounds.h - size.y),
  };
}
