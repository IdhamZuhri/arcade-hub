import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { formatTable, measureDir, listGameWorkspaces } from './lib/sizes.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(root);
fs.rmSync('dist', { recursive: true, force: true });

const games = listGameWorkspaces(root);
const failed = [];
for (const ws of ['apps/hub', ...games]) {
  const r = spawnSync(`npm run build -w ${ws}`, { stdio: 'inherit', shell: true });
  if (r.status !== 0) failed.push(ws);
}

const dist = path.join(root, 'dist');
const rows = [];
if (!failed.includes('apps/hub') && fs.existsSync(dist)) {
  rows.push({ name: 'apps/hub', ...measureDir(dist, [path.join(dist, 'games')]) });
}
for (const ws of games) {
  const out = path.join(dist, ws);
  if (!failed.includes(ws) && fs.existsSync(out)) rows.push({ name: ws, ...measureDir(out) });
}
console.log(`\n${formatTable(rows)}`);

if (failed.length > 0) {
  console.error(`FAILED: ${failed.join(', ')}`);
  process.exit(1);
}
