import { test, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { formatBytes, measureDir, formatTable, listGameWorkspaces } from '../lib/sizes.mjs';

let root;
beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'sizes-'));
});
afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

test('formatBytes', () => {
  expect(formatBytes(512)).toBe('512 B');
  expect(formatBytes(2048)).toBe('2.0 KB');
  expect(formatBytes(1572864)).toBe('1.50 MB');
});

test('formatTable lists names and aligns columns', () => {
  const out = formatTable([
    { name: 'hub', raw: 2048, gzip: 512 },
    { name: 'games/idham/longer-name', raw: 1572864, gzip: 1024 },
  ]);
  expect(out).toContain('hub');
  expect(out).toContain('games/idham/longer-name');
  const lines = out.split('\n');
  const cols = lines.map((l) => l.indexOf('|'));
  expect(new Set(cols).size).toBe(1);
  expect(cols[0]).toBeGreaterThan(0);
});

test('listGameWorkspaces returns sorted posix paths with package.json only', () => {
  const mk = (p, f) => {
    fs.mkdirSync(path.join(root, p), { recursive: true });
    if (f) fs.writeFileSync(path.join(root, p, f), '{}');
  };
  mk('games/b/y', 'package.json');
  mk('games/a/x', 'package.json');
  mk('games/a/nopkg');
  fs.writeFileSync(path.join(root, 'games/a/.gitkeep'), '');
  fs.writeFileSync(path.join(root, 'games/.gitkeep'), '');
  expect(listGameWorkspaces(root)).toEqual(['games/a/x', 'games/b/y']);
});

test('listGameWorkspaces returns [] when games is missing', () => {
  expect(listGameWorkspaces(root)).toEqual([]);
});

test('measureDir sums raw sizes recursively and gzips', () => {
  fs.mkdirSync(path.join(root, 'sub'));
  fs.writeFileSync(path.join(root, 'a.txt'), 'a'.repeat(1000));
  fs.writeFileSync(path.join(root, 'sub', 'b.txt'), 'b'.repeat(500));
  const m = measureDir(root);
  expect(m.raw).toBe(1500);
  expect(m.gzip).toBeGreaterThan(0);
  expect(m.gzip).toBeLessThan(1500);
});
