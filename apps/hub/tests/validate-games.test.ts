import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { validateGamesDir } from '../src/validate-games';

const BASE = '/pixel-arcade/';
let tmp = '';
let gamesDir = '';

const valid = () => ({
  id: 'idham-rpg',
  title: 'Pixel Quest',
  description: 'd',
  thumbnail: 'public/thumbnail.png',
  author: 'idham',
  owner: 'idham',
});

function writeGame(owner: string, game: string, json: unknown, thumb = true): void {
  const dir = path.join(gamesDir, owner, game);
  fs.mkdirSync(path.join(dir, 'public'), { recursive: true });
  const text = typeof json === 'string' ? json : JSON.stringify(json);
  fs.writeFileSync(path.join(dir, 'game.json'), text);
  if (thumb) fs.writeFileSync(path.join(dir, 'public', 'thumbnail.png'), 'png');
}

beforeEach(() => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'hub-validate-'));
  gamesDir = path.join(tmp, 'games');
  fs.mkdirSync(gamesDir);
  fs.writeFileSync(path.join(gamesDir, 'README.md'), 'not a game');
});

afterEach(() => {
  fs.rmSync(tmp, { recursive: true, force: true });
});

describe('validateGamesDir', () => {
  test('one valid game passes', () => {
    writeGame('idham', 'rpg', valid());
    const games = validateGamesDir(gamesDir, BASE);
    expect(games.map((g) => g.id)).toEqual(['idham-rpg']);
    expect(games[0]?.url).toBe('/pixel-arcade/games/idham/rpg/');
  });

  test('a ./-prefixed thumbnail passes', () => {
    writeGame('idham', 'rpg', { ...valid(), thumbnail: './public/thumbnail.png' });
    expect(validateGamesDir(gamesDir, BASE)).toHaveLength(1);
  });

  test('a folder without game.json is ignored', () => {
    fs.mkdirSync(path.join(gamesDir, 'idham', 'wip'), { recursive: true });
    expect(validateGamesDir(gamesDir, BASE)).toEqual([]);
  });

  test('a bad id throws naming the file', () => {
    writeGame('idham', 'rpg', { ...valid(), id: 'rpg' });
    expect(() => validateGamesDir(gamesDir, BASE)).toThrow('games/idham/rpg/game.json');
    expect(() => validateGamesDir(gamesDir, BASE)).toThrow('expected id "idham-rpg"');
  });

  test('a missing thumbnail file throws naming the file', () => {
    writeGame('idham', 'rpg', valid(), false);
    expect(() => validateGamesDir(gamesDir, BASE)).toThrow(
      /games\/idham\/rpg\/game\.json: thumbnail "public\/thumbnail\.png" not found/,
    );
  });

  test('malformed JSON throws naming the file', () => {
    writeGame('idham', 'rpg', '{ "id": ');
    expect(() => validateGamesDir(gamesDir, BASE)).toThrow(
      /games\/idham\/rpg\/game\.json: invalid JSON/,
    );
  });
});
