export const SPARK_LIFETIME = 0.18;

/** Age a hit spark by dt; null once it has burned out. */
export function ageSpark(age: number, dt: number): number | null {
  const t = age + dt;
  return t >= SPARK_LIFETIME ? null : t;
}

export function sparkFrame(age: number): string {
  return `spark-${Math.min(2, Math.floor((age / SPARK_LIFETIME) * 3))}`;
}
