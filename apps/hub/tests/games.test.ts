import { describe, expect, test } from 'vitest';
import { discoverGames, validateGame } from '../src/games';

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
