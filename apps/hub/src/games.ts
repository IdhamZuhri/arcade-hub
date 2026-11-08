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
  const thumbKey = jsonPath.slice(0, jsonPath.lastIndexOf('/') + 1) + s('thumbnail');
  const thumbnailUrl = thumbs[thumbKey];
  if (thumbnailUrl === undefined) {
    fail(`thumbnail "${s('thumbnail')}" not found`);
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
