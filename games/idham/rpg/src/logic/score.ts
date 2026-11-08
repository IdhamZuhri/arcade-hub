import { COIN_VALUE } from '../config/game';

export function scoreForCoins(n: number): number {
  return n * COIN_VALUE;
}
