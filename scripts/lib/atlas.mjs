import zlib from 'node:zlib';

function parseColour(spec, lineNo) {
  if (spec === 'transparent') return [0, 0, 0, 0];
  const m = /^#([0-9a-fA-F]{6})$/.exec(spec);
  if (!m) throw new Error(`line ${lineNo}: bad colour '${spec}'`);
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 255];
}

export function parseSprites(text) {
  const palette = new Map();
  const sprites = [];
  let mode = 'none';
  let current = null;
  const lines = text.split(/\r?\n/);
  lines.forEach((raw, i) => {
    const line = raw.trim();
    const lineNo = i + 1;
    if (line === '') return;
    // Inside a sprite block every line is a pixel row ('#' is not special).
    if (mode === 'sprite') {
      if (line === 'end') {
        sprites.push(current);
        current = null;
        mode = 'none';
      } else current.rows.push(line);
      return;
    }
    if (mode === 'palette' && /^#\s+(transparent|#[0-9a-fA-F]{6})$/.test(line)) {
      throw new Error(
        `line ${lineNo}: '#' is reserved for comments and cannot be a palette character`,
      );
    }
    if (line.startsWith('#')) return;
    if (line === 'palette') {
      mode = 'palette';
      return;
    }
    const sm = /^sprite\s+(\S+)$/.exec(line);
    if (sm) {
      if (sprites.some((x) => x.name === sm[1])) {
        throw new Error(`line ${lineNo}: duplicate sprite name '${sm[1]}'`);
      }
      current = { name: sm[1], w: 0, h: 0, rows: [] };
      mode = 'sprite';
      return;
    }
    if (mode === 'palette') {
      const [ch, spec] = line.split(/\s+/);
      if (ch.length !== 1 || !spec) throw new Error(`line ${lineNo}: bad palette entry '${line}'`);
      palette.set(ch, parseColour(spec, lineNo));
      return;
    }
    throw new Error(`line ${lineNo}: unexpected '${line}'`);
  });
  if (mode === 'sprite') throw new Error(`sprite ${current.name}: missing 'end'`);

  for (const s of sprites) {
    s.h = s.rows.length;
    s.w = s.rows[0]?.length ?? 0;
    if (s.h === 0) throw new Error(`sprite ${s.name}: no rows`);
    for (const row of s.rows) {
      if (row.length !== s.w) {
        throw new Error(`sprite ${s.name}: row width ${row.length} differs from width ${s.w}`);
      }
      for (const ch of row) {
        if (!palette.has(ch)) throw new Error(`sprite ${s.name}: unknown colour '${ch}'`);
      }
    }
  }
  return { palette, sprites };
}

const nextPow2 = (n) => 2 ** Math.ceil(Math.log2(Math.max(1, n)));

// Shelf packing, tallest first. Tries growing power-of-two widths until the
// result is no taller than it is wide (or the width exceeds the widest need).
export function packAtlas(sprites, padding = 1) {
  const sorted = [...sprites].sort((a, b) => b.h - a.h);
  const minW = Math.max(...sorted.map((s) => s.w + padding), 1);
  let shelfW = nextPow2(minW);
  let result;
  for (;;) {
    result = layout(sorted, shelfW, padding);
    if (result.usedH <= shelfW) break;
    shelfW *= 2;
  }
  return {
    width: shelfW,
    height: nextPow2(result.usedH),
    frames: result.frames,
  };
}

function layout(sorted, shelfW, padding) {
  const frames = {};
  let x = 0;
  let y = 0;
  let shelfH = 0;
  for (const s of sorted) {
    if (x + s.w + padding > shelfW) {
      x = 0;
      y += shelfH;
      shelfH = 0;
    }
    frames[s.name] = { x, y, w: s.w, h: s.h };
    x += s.w + padding;
    shelfH = Math.max(shelfH, s.h + padding);
  }
  return { frames, usedH: y + shelfH };
}

export function renderAtlas(packed, sprites, palette) {
  const { width, height, frames } = packed;
  const rgba = new Uint8Array(width * height * 4);
  for (const s of sprites) {
    const f = frames[s.name];
    s.rows.forEach((row, ry) => {
      for (let rx = 0; rx < row.length; rx++) {
        rgba.set(palette.get(row[rx]), ((f.y + ry) * width + f.x + rx) * 4);
      }
    });
  }
  return rgba;
}

export function scaleNearest(width, height, rgba, factor) {
  const w = width * factor;
  const h = height * factor;
  const out = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const src = (Math.floor(y / factor) * width + Math.floor(x / factor)) * 4;
      out.set(rgba.subarray(src, src + 4), (y * w + x) * 4);
    }
  }
  return { width: w, height: h, rgba: out };
}

// PNG chunk layout: 4-byte length, 4-byte type, data, 4-byte CRC over type+data.
function chunk(type, data) {
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const out = Buffer.alloc(body.length + 8);
  out.writeUInt32BE(data.length, 0);
  body.copy(out, 4);
  out.writeUInt32BE(zlib.crc32(body), body.length + 4);
  return out;
}

export function encodePng(width, height, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type RGBA
  // compression, filter, interlace stay 0
  const stride = width * 4;
  const raw = Buffer.alloc(height * (stride + 1)); // each row starts with filter byte 0
  for (let y = 0; y < height; y++) {
    Buffer.from(rgba.buffer, rgba.byteOffset + y * stride, stride).copy(raw, y * (stride + 1) + 1);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

export function toPhaserJson({ width, height, frames }) {
  const out = {};
  for (const [name, f] of Object.entries(frames)) {
    out[name] = {
      frame: { ...f },
      rotated: false,
      trimmed: false,
      spriteSourceSize: { x: 0, y: 0, w: f.w, h: f.h },
      sourceSize: { w: f.w, h: f.h },
    };
  }
  return {
    frames: out,
    meta: { image: 'atlas.png', format: 'RGBA8888', size: { w: width, h: height }, scale: '1' },
  };
}
