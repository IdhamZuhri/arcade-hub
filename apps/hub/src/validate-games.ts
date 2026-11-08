// Node-side (build-time) check of every games/<owner>/<game>/game.json. Imported by
// vite.config.ts only; never bundled into the browser.
import fs from 'node:fs';
import path from 'node:path';
import { discoverGames, type GameEntry } from './games.ts';

/** Same key shape as the browser's import.meta.glob('../../../games/...'). */
const KEY_ROOT = '../../../games';

function subdirs(dir: string): string[] {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
}

/**
 * Read and validate every game.json under `gamesDir`. Throws (naming the file) on malformed
 * JSON, a bad field, an id/owner/folder mismatch, or a thumbnail that is not on disk.
 */
export function validateGamesDir(gamesDir: string, base: string): GameEntry[] {
  const modules: Record<string, unknown> = {};
  const thumbs: Record<string, string> = {};
  if (!fs.existsSync(gamesDir)) return [];

  for (const owner of subdirs(gamesDir)) {
    for (const game of subdirs(path.join(gamesDir, owner))) {
      const dir = path.join(gamesDir, owner, game);
      const jsonFile = path.join(dir, 'game.json');
      if (!fs.existsSync(jsonFile)) continue;
      const key = `${KEY_ROOT}/${owner}/${game}`;

      try {
        modules[`${key}/game.json`] = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
      } catch (err) {
        const why = err instanceof Error ? err.message : String(err);
        throw new Error(`games/${owner}/${game}/game.json: invalid JSON (${why})`, {
          cause: err,
        });
      }

      // Mirror the browser glob games/*/*/public/*.png.
      const pub = path.join(dir, 'public');
      if (!fs.existsSync(pub)) continue;
      for (const f of fs.readdirSync(pub, { withFileTypes: true })) {
        if (f.isFile() && f.name.endsWith('.png')) {
          thumbs[`${key}/public/${f.name}`] = `${key}/public/${f.name}`;
        }
      }
    }
  }
  return discoverGames(modules, thumbs, base);
}
