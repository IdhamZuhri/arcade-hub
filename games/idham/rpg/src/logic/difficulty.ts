export function slimeSpeed(t: number): number {
  return Math.min(20 + 2 * t, 60);
}

export function spawnInterval(t: number): number {
  return Math.max(5 - 0.1 * t, 1.5);
}

export function slimeMode(t: number): 'wander' | 'chase' {
  return t >= 30 ? 'chase' : 'wander';
}
