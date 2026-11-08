import fs from 'node:fs';
import path from 'node:path';

const NAME_RE = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;
const TEXT_EXT = new Set(['.ts', '.json', '.html', '.md', '.txt']);

export function validateName(name) {
  if (typeof name === 'string' && NAME_RE.test(name)) return null;
  return `invalid game name "${name}": use lowercase letters, digits and single hyphens, starting with a letter (e.g. space-dodge)`;
}

export function toTitle(name) {
  return name
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function applyTokens(text, tokens) {
  let out = text;
  for (const [k, v] of Object.entries(tokens)) out = out.split(k).join(v);
  return out;
}

export function scaffold({ root, owner, name }) {
  const nameError = validateName(name);
  if (nameError) throw new Error(nameError);

  // Owner is a single plain folder name; this also rejects "." and "..".
  const ownerDir = path.join(root, 'games', owner);
  if (
    !NAME_RE.test(owner ?? '') ||
    !fs.existsSync(ownerDir) ||
    !fs.statSync(ownerDir).isDirectory()
  ) {
    throw new Error(`owner folder games/${owner} does not exist`);
  }

  const dir = path.join(ownerDir, name);
  if (fs.existsSync(dir)) throw new Error(`games/${owner}/${name} already exists`);

  const template = path.join(root, 'templates', 'game');
  if (!fs.existsSync(template)) throw new Error('template folder templates/game does not exist');

  fs.cpSync(template, dir, {
    recursive: true,
    filter: (src) => path.basename(src) !== 'node_modules',
  });

  const tokens = {
    __OWNER__: owner,
    __NAME__: name,
    __ID__: `${owner}-${name}`,
    __TITLE__: toTitle(name),
  };
  for (const rel of fs.readdirSync(dir, { recursive: true })) {
    const file = path.join(dir, rel);
    if (!fs.statSync(file).isFile() || !TEXT_EXT.has(path.extname(file))) continue;
    fs.writeFileSync(file, applyTokens(fs.readFileSync(file, 'utf8'), tokens));
  }
  return { dir };
}
