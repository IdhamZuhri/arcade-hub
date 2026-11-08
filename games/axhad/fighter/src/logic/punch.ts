import { BODY } from '../config/game';
import type { Rect } from './movement';

export type PunchPhase = 'startup' | 'active' | 'recovery' | 'done';

export function punchPhase(elapsed: number): PunchPhase {
  if (elapsed >= 0.4) return 'done';
  if (elapsed >= 0.2) return 'recovery';
  if (elapsed >= 0.1) return 'active';
  return 'startup';
}

export function punchHitbox(x: number, y: number, facing: 1 | -1): Rect {
  return { x: facing === 1 ? x + BODY.w : x - 16, y: y + 10, w: 16, h: 8 };
}

export function canLand(phase: PunchPhase, alreadyHit: boolean): boolean {
  return phase === 'active' && !alreadyHit;
}

/** True while a punch can still hurt: startup or active, not recovery. */
export function isThreatening(punchT: number): boolean {
  if (punchT < 0) return false;
  const phase = punchPhase(punchT);
  return phase === 'startup' || phase === 'active';
}
