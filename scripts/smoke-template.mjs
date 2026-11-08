import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { scaffold } from './lib/scaffold.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(root);
const tmp = path.join(root, 'games', 'idham', 'smoke-tmp');
const rel = 'games/idham/smoke-tmp';

let code = 0;
try {
  fs.rmSync(tmp, { recursive: true, force: true }); // stale folder from an aborted run
  scaffold({ root, owner: 'idham', name: 'smoke-tmp' });
  for (const args of [
    ['tsc', '--noEmit', '-p', rel],
    ['vitest', 'run', '--root', rel],
  ]) {
    const r = spawnSync(`npx ${args.join(' ')}`, { stdio: 'inherit', shell: true });
    if (r.status !== 0) {
      code = r.status ?? 1;
      break;
    }
  }
} catch (err) {
  console.error(err.message);
  code = 1;
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
process.exit(code);
