export type HeroHealth = { hearts: number; invuln: number };

export function takeHit(h: HeroHealth): HeroHealth {
  if (h.invuln > 0) return h;
  return { hearts: h.hearts - 1, invuln: 1 };
}

export function tickHealth(h: HeroHealth, dt: number): HeroHealth {
  return { ...h, invuln: Math.max(0, h.invuln - dt) };
}

export function isDead(h: HeroHealth): boolean {
  return h.hearts <= 0;
}
