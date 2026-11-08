import { test, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { validateName, toTitle, applyTokens, scaffold } from '../lib/scaffold.mjs';

let root;
const png = Buffer.from([0x89, 0x50, 0xff, 0x00, 0x13, 0x37, 0xfe, 0x80]);

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'scaffold-'));
  const t = path.join(root, 'templates', 'game');
  fs.mkdirSync(path.join(t, 'node_modules'), { recursive: true });
  fs.writeFileSync(path.join(t, 'node_modules', 'junk.txt'), '__ID__');
  fs.writeFileSync(
    path.join(t, 'game.json'),
    '{ "id": "__ID__", "title": "__TITLE__", "owner": "__OWNER__", "n": "__NAME__" }',
  );
  fs.writeFileSync(path.join(t, 'a.png'), png);
  fs.mkdirSync(path.join(root, 'games', 'idham'), { recursive: true });
});

afterEach(() => fs.rmSync(root, { recursive: true, force: true }));

const listing = (dir) => fs.readdirSync(dir, { recursive: true }).sort();

test('validateName accepts good names', () => {
  for (const n of ['rpg', 'space-dodge', 'snake2']) expect(validateName(n)).toBeNull();
});

test('validateName rejects bad names', () => {
  for (const n of ['RPG', '../x', '-x', 'x-', 'a--b', 'a b', '']) {
    expect(validateName(n), n).toEqual(expect.any(String));
  }
});

test('toTitle', () => {
  expect(toTitle('space-dodge')).toBe('Space Dodge');
});

test('applyTokens replaces every occurrence', () => {
  expect(applyTokens('__A__ __A__ __B__', { __A__: 'x', __B__: 'y' })).toBe('x x y');
});

test('scaffold copies, replaces tokens, keeps binaries', () => {
  const { dir } = scaffold({ root, owner: 'idham', name: 'snake' });
  expect(dir).toBe(path.join(root, 'games', 'idham', 'snake'));
  const json = fs.readFileSync(path.join(dir, 'game.json'), 'utf8');
  expect(json).toContain('"id": "idham-snake"');
  expect(json).toContain('"title": "Snake"');
  expect(json).toContain('"owner": "idham"');
  expect(json).toContain('"n": "snake"');
  expect(fs.readFileSync(path.join(dir, 'a.png')).equals(png)).toBe(true);
  expect(fs.existsSync(path.join(dir, 'node_modules'))).toBe(false);
});

test('refuses unknown owner without writing', () => {
  const before = listing(path.join(root, 'games'));
  expect(() => scaffold({ root, owner: 'bob', name: 'x' })).toThrow(
    /owner folder games\/bob does not exist/,
  );
  expect(listing(path.join(root, 'games'))).toEqual(before);
});

test('refuses existing target without writing', () => {
  scaffold({ root, owner: 'idham', name: 'snake' });
  const before = listing(path.join(root, 'games', 'idham'));
  expect(() => scaffold({ root, owner: 'idham', name: 'snake' })).toThrow(/already exists/);
  expect(listing(path.join(root, 'games', 'idham'))).toEqual(before);
});

test('refuses invalid name without writing', () => {
  const before = listing(path.join(root, 'games', 'idham'));
  expect(() => scaffold({ root, owner: 'idham', name: '../x' })).toThrow();
  expect(() => scaffold({ root, owner: 'idham', name: 'RPG' })).toThrow();
  expect(listing(path.join(root, 'games', 'idham'))).toEqual(before);
});

test('refuses owner with path separators', () => {
  expect(() => scaffold({ root, owner: '..', name: 'x' })).toThrow(/does not exist/);
});
