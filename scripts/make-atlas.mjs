import fs from 'node:fs';
import path from 'node:path';
import {
  parseSprites,
  packAtlas,
  renderAtlas,
  scaleNearest,
  encodePng,
  toPhaserJson,
} from './lib/atlas.mjs';

const THUMB_SCALE = 8;

const arg = process.argv[2];
if (!arg) {
  console.error('usage: node make-atlas.mjs <gameDir>');
  process.exit(1);
}
const gameDir = path.resolve(process.cwd(), arg);
const src = path.join(gameDir, 'art', 'sprites.txt');

try {
  const { palette, sprites } = parseSprites(fs.readFileSync(src, 'utf8'));
  const thumb = sprites.find((s) => s.name === 'thumbnail');
  if (!thumb) throw new Error(`${src}: no sprite named 'thumbnail'`);

  const packed = packAtlas(sprites);
  const rgba = renderAtlas(packed, sprites, palette);
  const assets = path.join(gameDir, 'public', 'assets');
  fs.mkdirSync(assets, { recursive: true });
  fs.writeFileSync(path.join(assets, 'atlas.png'), encodePng(packed.width, packed.height, rgba));
  fs.writeFileSync(path.join(assets, 'atlas.json'), JSON.stringify(toPhaserJson(packed), null, 2));

  const f = packed.frames.thumbnail;
  const tile = new Uint8Array(f.w * f.h * 4);
  for (let y = 0; y < f.h; y++) {
    const from = ((f.y + y) * packed.width + f.x) * 4;
    tile.set(rgba.subarray(from, from + f.w * 4), y * f.w * 4);
  }
  const big = scaleNearest(f.w, f.h, tile, THUMB_SCALE);
  fs.writeFileSync(
    path.join(gameDir, 'public', 'thumbnail.png'),
    encodePng(big.width, big.height, big.rgba),
  );

  console.log(
    `atlas ${packed.width}x${packed.height}, ${Object.keys(packed.frames).length} frames → ${path.join(assets, 'atlas.png')}`,
  );
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
