import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

// owner and name come from the folder: games/<owner>/<name>
const dir = path.dirname(fileURLToPath(import.meta.url));
const [owner, name] = dir.split(path.sep).slice(-2);

export default defineConfig({
  base: `/pixel-arcade/games/${owner}/${name}/`,
  build: {
    outDir: path.resolve(dir, '../../../dist/games', owner!, name!),
    emptyOutDir: true,
    chunkSizeWarningLimit: 1600,
  },
});
