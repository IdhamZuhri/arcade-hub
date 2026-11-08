import { punchPhase } from './punch';

export interface FighterAnimState {
  blocking: boolean;
  /** Seconds since the punch began, or -1 when not punching. */
  punchT: number;
  moving: boolean;
  animT: number;
}

/** Atlas frame suffix (after "p1-" / "p2-") for a fighter's current state. */
export function fighterFrame(s: FighterAnimState): string {
  if (s.punchT >= 0) return punchPhase(s.punchT) === 'startup' ? 'punch-0' : 'punch-1';
  if (s.blocking) return 'block';
  if (s.moving) return `walk-${Math.floor(s.animT / 0.15) % 2}`;
  return `idle-${Math.floor(s.animT / 0.4) % 2}`;
}
