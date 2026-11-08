import { test, expect } from 'vitest';
import zlib from 'node:zlib';
import { parseSprites, packAtlas, encodePng, toPhaserJson } from '../lib/atlas.mjs';

const SAMPLE = `# comment
palette
. transparent
k #1a1c2c
y #ffcd75
sprite hero-0
.kk.
kyyk
end
`;

test('parses palette and sprites', () => {
  const { palette, sprites } = parseSprites(SAMPLE);
  expect(sprites).toHaveLength(1);
  expect(sprites[0]).toMatchObject({ name: 'hero-0', w: 4, h: 2 });
  expect(palette.get('k')).toEqual([26, 28, 44, 255]);
  expect(palette.get('.')).toEqual([0, 0, 0, 0]);
});

test('rejects uneven rows', () => {
  const bad = SAMPLE.replace('kyyk', 'kyy');
  expect(() => parseSprites(bad)).toThrow(/hero-0.*width/);
});

test('rejects unknown colour', () => {
  const bad = SAMPLE.replace('kyyk', 'kyzk');
  expect(() => parseSprites(bad)).toThrow(/unknown colour 'z'/);
});

const isPow2 = (n) => n > 0 && (n & (n - 1)) === 0;

test('packs without overlap, inside a power-of-two canvas', () => {
  const sizes = [
    [16, 16],
    [8, 24],
    [30, 5],
    [12, 12],
    [7, 9],
  ];
  const sprites = sizes.map(([w, h], i) => ({ name: `s${i}`, w, h, rows: [] }));
  const { width, height, frames } = packAtlas(sprites, 1);
  expect(isPow2(width)).toBe(true);
  expect(isPow2(height)).toBe(true);
  const list = Object.values(frames);
  expect(list).toHaveLength(5);
  for (const f of list) {
    expect(f.x + f.w).toBeLessThanOrEqual(width);
    expect(f.y + f.h).toBeLessThanOrEqual(height);
  }
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      const a = list[i];
      const b = list[j];
      const overlap =
        a.x < b.x + b.w + 1 && b.x < a.x + a.w + 1 && a.y < b.y + b.h + 1 && b.y < a.y + a.h + 1;
      expect(overlap).toBe(false);
    }
  }
});

test('encodes a valid PNG', () => {
  const rgba = new Uint8Array(3 * 2 * 4);
  rgba.set([10, 20, 30, 255], 0);
  const png = encodePng(3, 2, rgba);
  expect([...png.subarray(0, 8)]).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  expect(png.readUInt32BE(16)).toBe(3);
  expect(png.readUInt32BE(20)).toBe(2);
  // Collect IDAT chunks.
  const parts = [];
  let off = 8;
  while (off < png.length) {
    const len = png.readUInt32BE(off);
    const type = png.toString('ascii', off + 4, off + 8);
    if (type === 'IDAT') parts.push(png.subarray(off + 8, off + 8 + len));
    off += 12 + len;
  }
  const raw = zlib.inflateSync(Buffer.concat(parts));
  expect(raw.length).toBe(2 * (1 + 3 * 4));
  expect([...raw.subarray(1, 5)]).toEqual([10, 20, 30, 255]);
});

test('phaser json mirrors packed frames', () => {
  const sprites = [{ name: 'hero-0', w: 4, h: 2, rows: [] }];
  const packed = packAtlas(sprites);
  const json = toPhaserJson(packed);
  expect(json.frames['hero-0'].frame).toEqual(packed.frames['hero-0']);
  expect(json.meta.image).toBe('atlas.png');
});

test('a sprite row starting with # is a pixel row, not a comment', () => {
  const bad = SAMPLE.replace('kyyk', '#..#');
  expect(() => parseSprites(bad)).toThrow(/unknown colour '#'/);
});

test('# cannot be a palette character', () => {
  expect(() => parseSprites(SAMPLE.replace('k #1a1c2c', '# #1a1c2c'))).toThrow(/#/);
});

test('duplicate sprite names are rejected', () => {
  const dup = `${SAMPLE}sprite hero-0\n.kk.\nend\n`;
  expect(() => parseSprites(dup)).toThrow(/duplicate.*hero-0/);
});

test('CRLF input with blanks and comments parses like LF', () => {
  const lf = `# top\n\npalette\n. transparent\nk #1a1c2c\n\n# mid\nsprite a\nk.\nend\n\n# tail\n`;
  const crlf = lf.replace(/\n/g, '\r\n');
  expect(parseSprites(crlf)).toEqual(parseSprites(lf));
  expect(parseSprites(crlf).sprites).toHaveLength(1);
});
