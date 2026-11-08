import { describe, expect, test } from 'vitest';
import { discoverGames, discoverValidGames, validateGame } from '../src/games';

const BASE = '/pixel-arcade/';
const THUMBS = { '../../../games/idham/rpg/public/thumbnail.png': '/t.png' };
const KEY = '../../../games/idham/rpg/game.json';
const valid = () => ({
  id: 'idham-rpg',
  title: 'Pixel Quest',
  description: 'd',
  thumbnail: 'public/thumbnail.png',
  author: 'idham',
  owner: 'idham',
});

describe('validateGame', () => {
  test('returns an entry for valid input', () => {
    const e = validateGame(valid(), KEY, THUMBS, BASE);
    expect(e.url).toBe('/pixel-arcade/games/idham/rpg/');
    expect(e.thumbnailUrl).toBe('/t.png');
    expect(e.folder).toBe('rpg');
    expect(e.title).toBe('Pixel Quest');
  });

  test('accepts a ./-prefixed thumbnail path', () => {
    const e = validateGame({ ...valid(), thumbnail: './public/thumbnail.png' }, KEY, THUMBS, BASE);
    expect(e.thumbnailUrl).toBe('/t.png');
  });

  test('a missing thumbnail says thumbnails must be PNGs under public/', () => {
    expect(() =>
      validateGame({ ...valid(), thumbnail: 'public/nope.png' }, KEY, THUMBS, BASE),
    ).toThrow('PNG');
    expect(() => validateGame({ ...valid(), thumbnail: 'thumb.jpg' }, KEY, THUMBS, BASE)).toThrow(
      'public/',
    );
  });

  const cases: [string, unknown, string?][] = [
    ['missing title', { ...valid(), title: undefined }],
    ['empty title', { ...valid(), title: '' }],
    ['wrong id', { ...valid(), id: 'rpg' }, 'expected id "idham-rpg"'],
    ['wrong owner', { ...valid(), owner: 'axhad' }],
    ['missing thumbnail', { ...valid(), thumbnail: 'public/nope.png' }],
    ['non-object', 'oops'],
    ['null', null],
  ];
  test.each(cases)('throws naming the file: %s', (_n, raw, extra) => {
    expect(() => validateGame(raw, KEY, THUMBS, BASE)).toThrow('games/idham/rpg/game.json');
    if (extra) expect(() => validateGame(raw, KEY, THUMBS, BASE)).toThrow(extra);
  });
});

describe('discoverGames', () => {
  test('sorts by title', () => {
    const thumbs = {
      ...THUMBS,
      '../../../games/axhad/fighter/public/thumbnail.png': '/u.png',
    };
    const mods = {
      [KEY]: { ...valid(), title: 'Zeta' },
      '../../../games/axhad/fighter/game.json': {
        ...valid(),
        id: 'axhad-fighter',
        owner: 'axhad',
        title: 'Alpha',
      },
    };
    expect(discoverGames(mods, thumbs, BASE).map((g) => g.title)).toEqual(['Alpha', 'Zeta']);
  });
  test('empty input', () => {
    expect(discoverGames({}, {}, BASE)).toEqual([]);
  });
});

describe('discoverValidGames', () => {
  test('keeps the valid games and reports the bad one', () => {
    const errors: unknown[] = [];
    const mods = {
      [KEY]: valid(),
      '../../../games/axhad/fighter/game.json': { ...valid(), id: 'nope', owner: 'axhad' },
    };
    const games = discoverValidGames(mods, THUMBS, BASE, (e) => errors.push(e));
    expect(games.map((g) => g.id)).toEqual(['idham-rpg']);
    expect(errors).toHaveLength(1);
    expect(String(errors[0])).toContain('games/axhad/fighter/game.json');
  });
});
