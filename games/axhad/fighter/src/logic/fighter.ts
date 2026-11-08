// Per-frame fighter rules, operating on ECS component data.
import { BODY, GROUND_Y, MAX_HP, WALK_SPEED } from '../config/game';
import { separate } from './arena';
import { overlaps } from './collision';
import { resolveHit } from './combat';
import type { Components } from './ecs';
import { step, type Rect } from './movement';
import { canLand, punchHitbox, punchPhase, type PunchPhase } from './punch';

export const FIGHTER_TOP = GROUND_Y - BODY.h;

export type FighterComponents = Required<
  Pick<
    Components,
    | 'position'
    | 'velocity'
    | 'size'
    | 'health'
    | 'facing'
    | 'punchT'
    | 'alreadyHit'
    | 'blocking'
    | 'anim'
    | 'start'
  >
>;

export interface FighterInput {
  move: -1 | 0 | 1;
  /** True only on the frame a punch is requested. */
  punch: boolean;
  block: boolean;
}

export function newFighter(x: number, facing: 1 | -1): FighterComponents {
  return {
    position: { x, y: FIGHTER_TOP },
    velocity: { x: 0, y: 0 },
    size: { x: BODY.w, y: BODY.h },
    health: { hp: MAX_HP, max: MAX_HP },
    facing,
    punchT: -1,
    alreadyHit: false,
    blocking: false,
    anim: { moving: false, t: 0 },
    start: { x, facing },
  };
}

/** Put a fighter back at its start spot with full health for a new round. */
export function resetFighter(c: FighterComponents): void {
  Object.assign(c, newFighter(c.start.x, c.start.facing));
}

export function isPunching(c: FighterComponents): boolean {
  return c.punchT >= 0;
}

export function phaseOf(c: FighterComponents): PunchPhase {
  return isPunching(c) ? punchPhase(c.punchT) : 'done';
}

export function bodyRect(c: FighterComponents): Rect {
  return { x: c.position.x, y: c.position.y, w: c.size.x, h: c.size.y };
}

export function fistRect(c: FighterComponents): Rect {
  return punchHitbox(c.position.x, c.position.y, c.facing);
}

export function canLandPunch(c: FighterComponents): boolean {
  return isPunching(c) && canLand(phaseOf(c), c.alreadyHit);
}

export function stepFighter(c: FighterComponents, dt: number, input: FighterInput): void {
  c.anim.t += dt;
  c.anim.moving = false;
  c.velocity = { x: 0, y: 0 };
  if (isPunching(c)) {
    c.punchT += dt;
    if (punchPhase(c.punchT) === 'done') c.punchT = -1;
    c.blocking = false;
    return;
  }
  // Blocking roots the fighter: no moving, no punching.
  c.blocking = input.block;
  if (c.blocking) return;
  if (input.punch) {
    c.punchT = 0;
    c.alreadyHit = false;
    return;
  }
  if (input.move !== 0) {
    c.velocity = { x: input.move * WALK_SPEED, y: 0 };
    c.position = step(c.position, c.velocity, dt);
    c.anim.moving = true;
  }
}

/** Keep both fighters on screen and apart, then turn them to face each other. */
export function settle(a: FighterComponents, b: FighterComponents): void {
  const sep = separate(a.position.x, b.position.x, a.size.x);
  a.position = { x: sep.a, y: a.position.y };
  b.position = { x: sep.b, y: b.position.y };
  a.facing = a.position.x <= b.position.x ? 1 : -1;
  b.facing = a.facing === 1 ? -1 : 1;
}

/** Land the attacker's punch on the defender if it can; returns the damage dealt, or null. */
export function landHit(attacker: FighterComponents, defender: FighterComponents): number | null {
  if (!canLandPunch(attacker) || !overlaps(fistRect(attacker), bodyRect(defender))) return null;
  attacker.alreadyHit = true;
  const { hp, dealt } = resolveHit(defender.health.hp, defender.blocking);
  defender.health = { hp, max: defender.health.max };
  return dealt;
}
