import { PUNCH_RANGE } from '../config/game';

export type CpuAction = 'approach' | 'punch' | 'block' | 'idle';

export function blockChance(level: number): number {
  return Math.min(0.3 + 0.15 * (level - 1), 0.75);
}

export function reactionTime(level: number): number {
  return Math.max(0.35 - 0.05 * (level - 1), 0.15);
}

export function decideCpu(
  v: { distance: number; playerPunching: boolean; canAct: boolean },
  rng: () => number,
  level: number,
): CpuAction {
  if (!v.canAct) return 'idle';
  if (v.playerPunching && rng() < blockChance(level)) return 'block';
  if (v.distance <= PUNCH_RANGE) return rng() < 0.6 ? 'punch' : 'idle';
  return 'approach';
}
