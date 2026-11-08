export type KeyValueStore = Pick<Storage, 'getItem' | 'setItem'>;

export const highScoreKey = (gameId: string): string => `arcade:${gameId}:highscore`;

const defaultStore = (): KeyValueStore | undefined => {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
};

export function loadHighScore(
  gameId: string,
  storage: KeyValueStore | undefined = defaultStore(),
): number {
  try {
    const raw = storage?.getItem(highScoreKey(gameId));
    if (raw == null) return 0;
    const n = Number(raw);
    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
  } catch {
    return 0;
  }
}

export function saveHighScore(
  gameId: string,
  score: number,
  storage: KeyValueStore | undefined = defaultStore(),
): void {
  try {
    storage?.setItem(highScoreKey(gameId), String(Math.floor(score)));
  } catch {
    // storage blocked or full: skip silently
  }
}

export function recordScore(
  gameId: string,
  score: number,
  storage: KeyValueStore | undefined = defaultStore(),
): { best: number; isNew: boolean } {
  const best = loadHighScore(gameId, storage);
  if (score > best) {
    saveHighScore(gameId, score, storage);
    return { best: Math.floor(score), isNew: true };
  }
  return { best, isNew: false };
}
