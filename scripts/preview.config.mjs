import path from 'node:path';
import { fileURLToPath } from 'node:url';

export default {
  root: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'),
  base: '/pixel-arcade/',
  appType: 'mpa',
  build: { outDir: 'dist' },
  preview: { port: 4173 },
};
