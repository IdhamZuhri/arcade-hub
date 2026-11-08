import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

export function formatBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

// `skip` holds absolute paths (files or folders) left out of the total.
export function measureDir(dir, skip = []) {
  let raw = 0;
  let gzip = 0;
  const walk = (d) => {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, entry.name);
      if (skip.includes(full)) continue;
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile()) {
        const buf = fs.readFileSync(full);
        raw += buf.length;
        gzip += zlib.gzipSync(buf).length;
      }
    }
  };
  walk(dir);
  return { raw, gzip };
}

export function formatTable(rows) {
  const w = Math.max('package'.length, ...rows.map((r) => r.name.length));
  const line = (a, b, c) => `${a.padEnd(w)} | ${b.padStart(10)} | ${c.padStart(10)}`;
  return [
    line('package', 'raw', 'gzip'),
    `${'-'.repeat(w)}-|-${'-'.repeat(10)}-|-${'-'.repeat(10)}`,
    ...rows.map((r) => line(r.name, formatBytes(r.raw), formatBytes(r.gzip))),
  ].join('\n');
}

export function listGameWorkspaces(root) {
  const games = path.join(root, 'games');
  if (!fs.existsSync(games)) return [];
  const out = [];
  for (const owner of fs.readdirSync(games, { withFileTypes: true })) {
    if (!owner.isDirectory()) continue;
    for (const game of fs.readdirSync(path.join(games, owner.name), { withFileTypes: true })) {
      if (
        game.isDirectory() &&
        fs.existsSync(path.join(games, owner.name, game.name, 'package.json'))
      ) {
        out.push(`games/${owner.name}/${game.name}`);
      }
    }
  }
  return out.sort();
}
