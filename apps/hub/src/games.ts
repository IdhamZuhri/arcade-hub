export interface GameEntry {
  id: string;
  title: string;
  description: string;
  author: string;
  owner: string;
  folder: string;
  thumbnailUrl: string;
  url: string;
}

const FIELDS = ['id', 'title', 'description', 'thumbnail', 'author', 'owner'];
const THUMB_RULE =
  'thumbnails must be PNG files directly inside public/, e.g. "public/thumbnail.png"';

/** POSIX-normalize a relative path: drop "." and empty segments, resolve "..". */
function normalizeRel(p: string): string {
  const out: string[] = [];
  for (const seg of p.split('/')) {
    if (seg === '' || seg === '.') continue;
    if (seg === '..' && out.length > 0 && out[out.length - 1] !== '..') out.pop();
    else out.push(seg);
  }
  return out.join('/');
}

export function validateGame(
  raw: unknown,
  jsonPath: string,
  thumbs: Record<string, string>,
  base: string,
): GameEntry {
  const segs = jsonPath.split('/');
  const folder = segs[segs.length - 2] ?? '';
  const owner = segs[segs.length - 3] ?? '';
  const where = `games/${owner}/${folder}/game.json`;
  const fail = (msg: string): never => {
    throw new Error(`${where}: ${msg}`);
  };

  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return fail('must be a JSON object');
  }
  const obj = raw as Record<string, unknown>;
  for (const f of FIELDS) {
    const v = obj[f];
    if (typeof v !== 'string' || v === '') {
      fail(`"${f}" must be a non-empty string`);
    }
  }
  const s = (k: string): string => obj[k] as string;

  if (s('owner') !== owner) {
    fail(`owner "${s('owner')}" must match folder "${owner}"`);
  }
  const expectedId = `${owner}-${folder}`;
  if (s('id') !== expectedId) {
    fail(`id "${s('id')}" invalid, expected id "${expectedId}"`);
  }
  const thumbRel = normalizeRel(s('thumbnail'));
  const thumbKey = jsonPath.slice(0, jsonPath.lastIndexOf('/') + 1) + thumbRel;
  const thumbnailUrl = thumbs[thumbKey];
  if (thumbnailUrl === undefined) {
    fail(`thumbnail "${s('thumbnail')}" not found (${THUMB_RULE})`);
  }

  return {
    id: s('id'),
    title: s('title'),
    description: s('description'),
    author: s('author'),
    owner,
    folder,
    thumbnailUrl: thumbnailUrl as string,
    url: `${base}games/${owner}/${folder}/`,
  };
}

export function discoverGames(
  modules: Record<string, unknown>,
  thumbs: Record<string, string>,
  base: string,
): GameEntry[] {
  return Object.entries(modules)
    .map(([path, raw]) => validateGame(raw, path, thumbs, base))
    .sort((a, b) => a.title.localeCompare(b.title));
}

/** Like discoverGames, but skips entries that fail validation and reports them to onError. */
export function discoverValidGames(
  modules: Record<string, unknown>,
  thumbs: Record<string, string>,
  base: string,
  onError: (err: unknown) => void,
): GameEntry[] {
  const games: GameEntry[] = [];
  for (const [path, raw] of Object.entries(modules)) {
    try {
      games.push(validateGame(raw, path, thumbs, base));
    } catch (err) {
      onError(err);
    }
  }
  return games.sort((a, b) => a.title.localeCompare(b.title));
}
