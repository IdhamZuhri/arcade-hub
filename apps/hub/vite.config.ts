import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vite';
import { validateGamesDir } from './src/validate-games.ts';

const BASE = '/pixel-arcade/';
const gamesDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../games');

/** Fail `vite build` / `vite dev` when any games/<owner>/<game>/game.json is invalid. */
function validateGames(): Plugin {
  return {
    name: 'pixel-arcade:validate-games',
    buildStart() {
      const games = validateGamesDir(gamesDir, BASE);
      this.info(`validated ${games.length} game.json file(s)`);
    },
  };
}

export default defineConfig({
  base: BASE,
  plugins: [validateGames()],
  build: { outDir: '../../dist', emptyOutDir: false },
});
