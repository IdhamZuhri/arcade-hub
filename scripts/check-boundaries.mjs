import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractSpecifiers, checkImport } from './lib/boundaries.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function* tsFiles(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* tsFiles(full);
    else if (entry.name.endsWith('.ts')) yield full;
  }
}

function* gameDirs() {
  // The template is checked as a game of its own, so a bad import is caught before scaffolding.
  const template = path.join(root, 'templates', 'game');
  if (fs.existsSync(path.join(template, 'package.json'))) yield template;
  const gamesRoot = path.join(root, 'games');
  if (!fs.existsSync(gamesRoot)) return;
  for (const owner of fs.readdirSync(gamesRoot, { withFileTypes: true })) {
    if (!owner.isDirectory()) continue;
    const ownerDir = path.join(gamesRoot, owner.name);
    for (const game of fs.readdirSync(ownerDir, { withFileTypes: true })) {
      const dir = path.join(ownerDir, game.name);
      if (game.isDirectory() && fs.existsSync(path.join(dir, 'package.json'))) yield dir;
    }
  }
}

const rel = (p) => path.relative(root, p).replaceAll('\\', '/');
let count = 0;
const violations = [];

for (const dir of gameDirs()) {
  for (const sub of ['src', 'tests']) {
    for (const file of tsFiles(path.join(dir, sub))) {
      count++;
      const source = fs.readFileSync(file, 'utf8');
      for (const spec of extractSpecifiers(source)) {
        const msg = checkImport(rel(file), spec, rel(dir), sub === 'tests');
        if (msg) violations.push(`${rel(file)}: ${msg}`);
      }
    }
  }
}

if (violations.length > 0) {
  console.error(violations.join('\n'));
  process.exit(1);
}
console.log(`boundaries OK (${count} files)`);
