// Per-frame rules for the rpg's entities, operating on ECS component data.
import { HERO_SPEED, ROOM_COLS, ROOM_ROWS, SLIME_REPICK, TILE } from '../config/game';
import { chaseVelocity, wanderVelocity } from './ai';
import type { Components } from './ecs';
import { isDead, takeHit, tickHealth, type HeroHealth } from './health';
import { clampToBounds, inputToVelocity, step, type Rect, type Vec2 } from './movement';
import type { Tile } from './spawn';

/** Component record with the listed components present. */
export type With<K extends keyof Components> = Required<Pick<Components, K>>;

/** The floor area inside the one-tile wall border. */
export const ROOM_BOUNDS: Rect = {
  x: TILE,
  y: TILE,
  w: (ROOM_COLS - 2) * TILE,
  h: (ROOM_ROWS - 2) * TILE,
};

export function hitRect(c: With<'position' | 'hitbox'>): Rect {
  return {
    x: c.position.x + c.hitbox.x,
    y: c.position.y + c.hitbox.y,
    w: c.hitbox.w,
    h: c.hitbox.h,
  };
}

export function center(c: With<'position' | 'size'>): Vec2 {
  return { x: c.position.x + c.size.x / 2, y: c.position.y + c.size.y / 2 };
}

/** The tile under the hero's centre. */
export function heroTile(c: With<'position' | 'size'>): Tile {
  const p = center(c);
  return { col: Math.floor(p.x / TILE), row: Math.floor(p.y / TILE) };
}

/** The tile a coin or slime blocks for spawning, from its top-left position. */
export function occupiedTile(p: Vec2): Tile {
  return { col: Math.floor((p.x + 4) / TILE), row: Math.floor((p.y + 4) / TILE) };
}

export function moveHero(
  c: With<'position' | 'velocity' | 'size'>,
  dx: -1 | 0 | 1,
  dy: -1 | 0 | 1,
  dt: number,
): void {
  c.velocity = inputToVelocity(dx, dy, HERO_SPEED);
  c.position = clampToBounds(step(c.position, c.velocity, dt), c.size, ROOM_BOUNDS);
}

export function moveSlime(
  c: With<'position' | 'velocity' | 'size' | 'slime'>,
  dt: number,
  speed: number,
  mode: 'wander' | 'chase',
  target: Vec2,
  rng: () => number,
): void {
  c.slime.repick -= dt;
  if (mode === 'chase') {
    c.velocity = chaseVelocity(center(c), target, speed);
  } else if (c.slime.repick <= 0) {
    c.velocity = wanderVelocity(rng, speed);
    c.slime.repick = SLIME_REPICK;
  }
  const p = step(c.position, c.velocity, dt);
  const clamped = clampToBounds(p, c.size, ROOM_BOUNDS);
  if (clamped.x !== p.x || clamped.y !== p.y) c.slime.repick = 0; // hit a wall: new heading
  c.position = clamped;
}

type HeroHp = With<'health' | 'invuln'>;

const heroHealth = (c: HeroHp): HeroHealth => ({ hearts: c.health.hp, invuln: c.invuln });

function storeHealth(c: HeroHp, h: HeroHealth): void {
  c.health = { hp: h.hearts, max: c.health.max };
  c.invuln = h.invuln;
}

export function tickInvuln(c: HeroHp, dt: number): void {
  storeHealth(c, tickHealth(heroHealth(c), dt));
}

export function hitHero(c: HeroHp): void {
  storeHealth(c, takeHit(heroHealth(c)));
}

export function heroDead(c: HeroHp): boolean {
  return isDead(heroHealth(c));
}
