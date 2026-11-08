export function matchScore(damageDealt: number, wonRoundTimeLeft: number[]): number {
  const bonus = wonRoundTimeLeft.reduce((s, t) => s + Math.floor(t) * 2, 0);
  return damageDealt + 100 * wonRoundTimeLeft.length + bonus;
}
