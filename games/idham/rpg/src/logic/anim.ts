export type HeroFacing = 'down' | 'up' | 'side';

/** Hero walk-cycle state, stored on the hero entity as its `anim` component. */
export interface HeroAnim {
  facing: HeroFacing;
  /** Seconds walked without stopping; 0 while standing. */
  walkT: number;
  /** Side sprite mirrored (last horizontal move was to the left). */
  flipX: boolean;
}

export function nextHeroAnim(a: HeroAnim, dx: -1 | 0 | 1, dy: -1 | 0 | 1, dt: number): HeroAnim {
  const walkT = dx || dy ? a.walkT + dt : 0;
  if (dx !== 0) return { facing: 'side', walkT, flipX: dx < 0 };
  if (dy !== 0) return { ...a, facing: dy < 0 ? 'up' : 'down', walkT };
  return { ...a, walkT };
}

export function heroFrame(a: HeroAnim): string {
  return `hero-${a.facing}-${Math.floor(a.walkT * 6) % 2}`;
}

/** Blink at 10 Hz while invulnerable. */
export function blinkVisible(invuln: number): boolean {
  return invuln <= 0 || Math.floor(invuln * 10) % 2 === 0;
}

export function slimeFrame(timeMs: number): string {
  return Math.floor(timeMs / 300) % 2 === 0 ? 'slime-0' : 'slime-1';
}

const SPIN = [0, 1, 2, 1] as const;

export function coinFrame(timeMs: number): string {
  return `coin-${SPIN[Math.floor(timeMs / 150) % SPIN.length]}`;
}
