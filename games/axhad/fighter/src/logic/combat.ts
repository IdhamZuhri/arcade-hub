import { CHIP_RATIO, PUNCH_DAMAGE } from '../config/game';

export function resolveHit(defenderHp: number, blocking: boolean): { hp: number; dealt: number } {
  const raw = blocking ? PUNCH_DAMAGE * CHIP_RATIO : PUNCH_DAMAGE;
  const dealt = Math.min(raw, Math.max(defenderHp, 0));
  return { hp: defenderHp - dealt, dealt };
}
