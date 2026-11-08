# pixel-arcade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an npm-workspaces monorepo with an arcade hub that auto-discovers games, two Phaser 3 placeholder games (idham/rpg, axhad/fighter), a new-game scaffold, a combined `dist/` build, CI/deploy workflows and contributor docs.

**Architecture:** Every package is its own Vite app. `scripts/build-all.mjs` builds the hub into `dist/` and each game into `dist/games/<owner>/<game>/`. Game rules live in Phaser-free `src/logic/` modules, tested with Vitest; Phaser scenes and systems are thin glue. Both placeholders are created from `templates/game` using the scaffold script, so they share one structure.

**Tech Stack:** Node ≥ 22.12, npm workspaces, Vite 8, TypeScript 6 (strict), Phaser 3.90.0, Vitest 5, ESLint 10 flat config + typescript-eslint 8, Prettier 3.

**Spec:** `docs/superpowers/specs/2026-11-08-pixel-arcade-design.md`. Read it before starting any task. Section references below (§n) point into it.

## Global Constraints

- Phaser is pinned to exactly `3.90.0`. Do not install Phaser 4 (npm's `latest` tag is 4.x).
- TypeScript is pinned to `~6.0.3`. typescript-eslint supports `<6.1.0`, so do not install TypeScript 7.
- Root devDependencies only: `typescript ~6.0.3`, `vite ^8.3.6`, `vitest ^5.1.0`, `eslint ^10.14.0`, `@eslint/js ^10.0.1`, `typescript-eslint ^8.72.1`, `eslint-config-prettier ^10.1.8`, `globals ^17.14.0`, `prettier ^3.9.10`, `@types/node ^24.19.2`. `@types/node` is the one addition beyond §6, and it is a types-only dev dependency for `vite.config.ts`. **No other dependencies.**
- Each game has runtime dependencies `phaser: 3.90.0` and `@pixel-arcade/shared: *`, and nothing else.
- Every package uses `"type": "module"` and `"private": true`, and its tsconfig extends `tsconfig.base.json` (`strict`, `noUncheckedIndexedAccess`, `moduleResolution: "bundler"`, `target/module: ES2022`, `noEmit`, `lib: ["ES2022","DOM"]`, `skipLibCheck`).
- The tsconfig for the hub, the template and every game also sets `"types": ["vite/client", "node"]` and includes `src`, `tests` and `vite.config.ts`.
- Vitest globals are off. Every test file imports `{ test, expect, … }` from `'vitest'`. The test snippets below leave that import out for brevity.
- Base paths: the hub uses `/pixel-arcade/`; each game uses `/pixel-arcade/games/<owner>/<game>/`.
- The high-score key is `arcade:<id>:highscore`, where id is `<owner>-<game>` (e.g. `arcade:idham-rpg:highscore`).
- Owner folders are exactly `games/idham/` and `games/axhad/`. GitHub username placeholders are exactly `@OWNER_USERNAME` (idham) and `@BROTHER_USERNAME` (axhad).
- Placeholder titles: "Pixel Quest" (idham-rpg) and "Pixel Brawl" (axhad-fighter). The license is MIT, "Copyright (c) 2026 idham and axhad".
- Games may import only relative files inside their own folder, plus `phaser`, `@pixel-arcade/shared`, and `vitest` (in tests only).
- `src/logic/**` must never import `phaser` or `@pixel-arcade/shared`.
- Logical resolution is 320×180 and `pixelArt: true` in every game.
- Every frame's dt is `clampDt(deltaMs)` in seconds, capped at 0.1 s.
- Use small commits that end with the line `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- The repo is developed on Windows and CI runs on Linux. Scripts must use `node:path` and `fileURLToPath`, never hardcoded `/` or `\`. Spawn npm with `shell: true`.

## Branches and worktrees

Create each branch in a git worktree under `.worktrees/`, which is gitignored (use superpowers:using-git-worktrees). Run `npm install` in each new worktree. After a branch's tasks pass review and verification, merge it into `main` locally with `--no-ff`, then start the next branch from the updated `main`.

| Branch | Tasks |
|---|---|
| `tooling/root-setup` | 1 |
| `shared/helpers` | 2 |
| `tooling/atlas` | 3 |
| `hub/launcher` | 4 |
| `tooling/template-scaffold` | 5, 6, 7 |
| `game/idham-rpg/placeholder` | 8, 9 |
| `game/axhad-fighter/placeholder` | 10, 11 |
| `tooling/github-docs` | 12, 13 |

## Review Focus

1. **Blocked or corrupt localStorage** (private mode, quota exceeded, values like `"NaN"`, `"-5"`, `"1e400"`, `"12.7"`): the high score reads as 0 or the floored valid integer, a failed write is silently skipped, and the game keeps running. *Tests are in Task 2.*
2. **A bad `game.json`** (missing field, wrong `id`, wrong `owner`, missing thumbnail file): the hub build fails with a message naming the file, rather than rendering a broken card. *Tests are in Task 4.*
3. **Windows backslash paths** in the boundary check and scaffold: a Windows path like `games\idham\rpg\src\a.ts` must be judged exactly as the POSIX path would be. *Tests are in Task 1 and Task 6.*
4. **A long frame after a backgrounded tab** (delta ≥ 1000 ms): entities must not tunnel through walls and timers must not jump. `clampDt` caps dt at 0.1 s. *Tests are in Task 5.*
5. **Bad scaffold input** (`RPG`, `../x`, `-x`, an unknown owner, a game that already exists): the script refuses with a message, exits 1, and creates no files. *Tests are in Task 6.*

---

### Task 1: Root tooling and boundary check

**Branch:** `tooling/root-setup`

**Files:**
- Create: `package.json`, `tsconfig.base.json`, `eslint.config.js`, `.prettierrc`, `.prettierignore`, `.gitignore`, `.gitattributes`, `LICENSE`, `.editorconfig`
- Create: `scripts/lib/boundaries.mjs`, `scripts/check-boundaries.mjs`
- Test: `scripts/tests/boundaries.test.mjs`

**Interfaces:**
- Produces: the root scripts `lint`, `format`, `typecheck`, `test` (and later `dev:hub`, `new-game`, `build`, `preview`, `smoke:template`).
- Produces: `extractSpecifiers(source: string): string[]` and `checkImport(fromFile: string, specifier: string, gameDir: string, isTest: boolean): string | null`. `checkImport` returns an error message or `null`.

- [ ] **Step 1: Write the root config files.**
  - `package.json` workspaces: `["apps/*", "packages/*", "games/*/*"]`, with `engines.node ">=22.12"`.
  - Scripts:
    - `"lint": "eslint . && prettier --check . && node scripts/check-boundaries.mjs"`
    - `"format": "prettier --write ."`
    - `"typecheck": "npm run typecheck --workspaces --if-present"`
    - `"test": "vitest run --dir scripts && npm run test --workspaces --if-present"`
  - `.gitignore`: `node_modules/`, `dist/`, `.worktrees/`, `coverage/`, `*.log`.
  - `.gitattributes`: `* text=auto eol=lf` and `*.png binary`.
  - `.prettierrc`: `{ "singleQuote": true, "printWidth": 100 }`.
  - `.prettierignore`: `dist`, `node_modules`, `package-lock.json`, `.worktrees`.
  - `eslint.config.js`:
    - ignores `dist/**` and `.worktrees/**`.
    - applies `@eslint/js` recommended, `typescript-eslint` recommended and `eslint-config-prettier`.
    - `**/*.ts` gets browser globals; `scripts/**` and `**/vite.config.ts` get node globals.
  - `LICENSE`: the MIT text with the copyright line from Global Constraints.

- [ ] **Step 2: Install the dev dependencies** at the exact ranges listed in Global Constraints.
  - Run: `npm install -D <list>`
  - Expected: `package-lock.json` is created and the install exits 0.

- [ ] **Step 3: Write the failing tests** in `scripts/tests/boundaries.test.mjs`:

```js
import { extractSpecifiers, checkImport } from '../lib/boundaries.mjs';
const G = 'games/idham/rpg';
test('extracts static, dynamic, side-effect and re-export specifiers', () => {
  const src = `import a from './a';\nimport './side';\nexport { b } from "../b";\nconst c = await import('./c');\nimport type { T } from './t';`;
  expect(extractSpecifiers(src).sort()).toEqual(['../b', './a', './c', './side', './t']);
});
test('allows relative imports inside the game', () => {
  expect(checkImport(`${G}/src/scenes/Play.ts`, '../logic/score', G, false)).toBeNull();
});
test('rejects relative imports escaping the game', () => {
  expect(checkImport(`${G}/src/a.ts`, '../../../axhad/fighter/src/x', G, false)).toMatch(/outside/);
});
test('rejects a sibling folder whose name starts with the game name', () => {
  expect(checkImport(`${G}/src/a.ts`, '../../rpg2/src/x', G, false)).toMatch(/outside/);
});
test('allowed bare packages', () => {
  expect(checkImport(`${G}/src/a.ts`, 'phaser', G, false)).toBeNull();
  expect(checkImport(`${G}/src/a.ts`, '@pixel-arcade/shared', G, false)).toBeNull();
  expect(checkImport(`${G}/tests/a.test.ts`, 'vitest', G, true)).toBeNull();
  expect(checkImport(`${G}/src/a.ts`, 'vitest', G, false)).toMatch(/not allowed/);
  expect(checkImport(`${G}/src/a.ts`, 'lodash', G, false)).toMatch(/not allowed/);
});
test('Windows paths behave like POSIX paths', () => {
  expect(checkImport('games\\idham\\rpg\\src\\a.ts', '../logic/x', 'games\\idham\\rpg', false)).toBeNull();
  expect(checkImport('games\\idham\\rpg\\src\\a.ts', '../../../axhad/x', 'games\\idham\\rpg', false)).toMatch(/outside/);
});
test('logic files may not import phaser or shared', () => {
  expect(checkImport(`${G}/src/logic/a.ts`, 'phaser', G, false)).toMatch(/logic/);
  expect(checkImport(`${G}/src/logic/a.ts`, '@pixel-arcade/shared', G, false)).toMatch(/logic/);
});
```

- [ ] **Step 4: Run the tests and confirm they fail.**
  - Run: `npx vitest run --dir scripts`
  - Expected: FAIL, because `boundaries.mjs` cannot be resolved.

- [ ] **Step 5: Implement `scripts/lib/boundaries.mjs`.**
  - `extractSpecifiers`: use regexes for `from '…'`, `import '…'` and `import('…')`.
  - `checkImport`:
    - normalize both paths with `.replaceAll('\\','/')`, then resolve with `path.posix`.
    - "inside" means the resolved path equals `gameDir` or starts with `gameDir + '/'`.
    - Allowed bare specifiers are `phaser` and `@pixel-arcade/shared`, plus `vitest` when `isTest` is true. A bare specifier also matches its subpaths, e.g. `phaser/…`.

- [ ] **Step 6: Implement `scripts/check-boundaries.mjs`.**
  - For each directory `games/*/*` that has a `package.json`, walk `src/` and `tests/` for `.ts` files.
  - Print each violation as `file: message`.
  - Exit 1 if there were any violations. Otherwise print `boundaries OK (<n> files)` and exit 0.

- [ ] **Step 7: Verify.**
  - Run: `npx vitest run --dir scripts`. Expected: 7 tests pass.
  - Run: `npm run format && npm run lint`. Expected: exit 0, and the output ends with `boundaries OK (0 files)`.

- [ ] **Step 8: Commit.** Message: `chore: root workspace tooling and import boundary check`. Then merge the branch to `main`.

---

### Task 2: Shared helpers

**Branch:** `shared/helpers`

**Files:**
- Create: `packages/shared/package.json`, `packages/shared/tsconfig.json`, `packages/shared/README.md`
- Create: `packages/shared/src/index.ts`, `src/storage.ts`, `src/scale.ts`, `src/input.ts`
- Test: `packages/shared/tests/storage.test.ts`

**Interfaces:**
- Produces, from `@pixel-arcade/shared`:
  - `highScoreKey(gameId: string): string`
  - `loadHighScore(gameId: string, storage?: KeyValueStore): number`
  - `saveHighScore(gameId: string, score: number, storage?: KeyValueStore): void`
  - `recordScore(gameId: string, score: number, storage?: KeyValueStore): { best: number; isNew: boolean }`
  - `type KeyValueStore = Pick<Storage, 'getItem' | 'setItem'>`
  - `pixelScaleConfig(width: number, height: number): Phaser.Types.Core.GameConfig`, which returns `{ width, height, pixelArt: true, backgroundColor: '#0d0d14', scale: { mode: FIT, autoCenter: CENTER_BOTH, parent: 'game' } }`
  - `isTouchDevice(scene: Phaser.Scene): boolean`
  - `addTouchButton(scene: Phaser.Scene, opts: { x: number; y: number; label: string; radius?: number }): TouchButton`, where `interface TouchButton { readonly isDown: boolean; destroy(): void }`

- [ ] **Step 1: Write the package files.**
  - `package.json`: name `@pixel-arcade/shared` and `exports { ".": "./src/index.ts", "./storage": "./src/storage.ts" }`.
  - Dependencies: `peerDependencies { "phaser": "^3.90.0" }` and `devDependencies { "phaser": "3.90.0" }`.
  - Scripts: `typecheck: tsc --noEmit -p .`, `test: vitest run`.

- [ ] **Step 2: Write the failing tests** in `tests/storage.test.ts`. They import from `../src/storage` only, because Phaser cannot load under Node.

```ts
const mem = (init: Record<string, string> = {}) => {
  const d = { ...init };
  return { getItem: (k: string) => d[k] ?? null, setItem: (k: string, v: string) => { d[k] = v; }, d };
};
const throwing = { getItem: () => { throw new Error('denied'); }, setItem: () => { throw new Error('quota'); } };
test('key format', () => expect(highScoreKey('idham-rpg')).toBe('arcade:idham-rpg:highscore'));
test('missing → 0', () => expect(loadHighScore('g', mem())).toBe(0));
test.each([['NaN', 0], ['-5', 0], ['1e400', 0], ['abc', 0], ['12.7', 12], ['40', 40]])(
  'stored %s → %d', (raw, want) => expect(loadHighScore('g', mem({ 'arcade:g:highscore': raw }))).toBe(want));
test('throwing storage → 0, save is a no-op', () => {
  expect(loadHighScore('g', throwing)).toBe(0);
  expect(() => saveHighScore('g', 5, throwing)).not.toThrow();
});
test('no storage available (undefined) → 0', () => expect(loadHighScore('g', undefined)).toBe(0));
test('recordScore only saves a new best', () => {
  const s = mem({ 'arcade:g:highscore': '50' });
  expect(recordScore('g', 30, s)).toEqual({ best: 50, isNew: false });
  expect(recordScore('g', 70, s)).toEqual({ best: 70, isNew: true });
  expect(s.d['arcade:g:highscore']).toBe('70');
});
```

- [ ] **Step 3: Run the tests and confirm they fail.**
  - Run: `npm run test -w packages/shared`
  - Expected: FAIL, because the module cannot be resolved.

- [ ] **Step 4: Implement `src/storage.ts`.**
  - The default `storage` argument comes from `defaultStore()`. It returns `globalThis.localStorage` inside a try/catch, or `undefined` if access throws.
  - A stored value counts only if it parses to a finite number ≥ 0. Floor it.
  - **Important:** the "no storage available" test passes `undefined` explicitly, and JavaScript treats an explicit `undefined` exactly like a missing argument. So under Node the default is used, and the default must also yield 0 when no `localStorage` exists.

- [ ] **Step 5: Run the tests and confirm they pass.**
  - Run: `npm run test -w packages/shared`
  - Expected: all tests pass.

- [ ] **Step 6: Implement `src/scale.ts`, `src/input.ts` and `src/index.ts`** (re-export everything).
  - `addTouchButton`:
    - calls `scene.input.addPointer(2)` once, so three pointers can be held at once.
    - draws a translucent circle plus a text label, both with `setScrollFactor(0)` and depth 1000.
    - tracks the set of pointer ids currently down on the button. `pointerdown` adds an id; `pointerup` and `pointerout` remove it.
    - `isDown` is true while that set is non-empty.
  - Write the README with one line per export.

- [ ] **Step 7: Verify.**
  - Run: `npm run typecheck -w packages/shared && npm run lint`
  - Expected: exit 0.

- [ ] **Step 8: Commit.** Message: `feat(shared): safe high score storage, scale config, touch buttons`. Then merge the branch to `main`.

---

### Task 3: Pixel atlas generator

**Branch:** `tooling/atlas`

**Files:**
- Create: `scripts/lib/atlas.mjs`, `scripts/make-atlas.mjs`
- Test: `scripts/tests/atlas.test.mjs`

**Interfaces:**
- Produces:
  - `parseSprites(text: string): { palette: Map<string, [r,g,b,a]>, sprites: { name: string, w: number, h: number, rows: string[] }[] }`
  - `packAtlas(sprites, padding = 1): { width: number, height: number, frames: Record<string, {x,y,w,h}> }`
  - `encodePng(width: number, height: number, rgba: Uint8Array): Buffer`
  - `toPhaserJson(packed): object`
- Produces the CLI `node scripts/make-atlas.mjs <gameDir>`. It reads `<gameDir>/art/sprites.txt` and writes:
  - `<gameDir>/public/assets/atlas.png` and `atlas.json` (in Phaser JSON-hash format)
  - `<gameDir>/public/thumbnail.png`: the sprite named `thumbnail`, scaled 8× with nearest-neighbour.
- The `sprites.txt` format is used by Tasks 5, 9 and 11:

```
# comment
palette
. transparent
k #1a1c2c
y #ffcd75
sprite hero-0
.kk.
kyyk
end
```

  Every row of a sprite must have the same width, and every character must be in the palette.

- [ ] **Step 1: Write the failing tests.**
  - **parse:** the example above gives 1 sprite (`hero-0`, w=4, h=2) and palette `k` = `[26,28,44,255]`. `.` is `[0,0,0,0]`.
  - **parse errors:**
    - rows of uneven width throw an error matching `/hero-0.*width/`.
    - an unknown character throws an error matching `/unknown colour 'z'/`.
  - **pack:**
    - for 5 sprites of mixed sizes, no two frames overlap (including the 1-px padding).
    - every frame lies inside `width × height`.
    - `width` and `height` are powers of two.
  - **png:**
    - the output starts with bytes `89 50 4E 47 0D 0A 1A 0A`.
    - the IHDR width and height (read as big-endian at byte offsets 16 and 20) equal the inputs.
    - `zlib.inflateSync` of the IDAT data gives `height × (1 + width × 4)` bytes, and the first pixel round-trips.
  - **phaser json:** `frames['hero-0'].frame` deep-equals the packed rect. `meta.image === 'atlas.png'`.

- [ ] **Step 2: Run the tests and confirm they fail.**
  - Run: `npx vitest run --dir scripts`
  - Expected: FAIL, because the module cannot be resolved.

- [ ] **Step 3: Implement `scripts/lib/atlas.mjs`.**
  - **Packing:** shelf-pack the sprites sorted by height, tallest first, then round the canvas up to a power of two.
  - **PNG encoding:**
    - colour type 6 (RGBA), 8-bit, with filter byte 0 on every row.
    - deflate with `zlib.deflateSync`.
    - checksum each chunk with `zlib.crc32` (available since Node 22.2).

- [ ] **Step 4: Run the tests and confirm they pass.**
  - Run: `npx vitest run --dir scripts`
  - Expected: all tests pass.

- [ ] **Step 5: Implement the CLI `scripts/make-atlas.mjs`.**
  - It throws a clear error if there is no `thumbnail` sprite.
  - It prints `atlas <w>x<h>, <n> frames → <path>`.

- [ ] **Step 6: Commit.** Message: `feat(tooling): zero-dependency pixel atlas generator`. Run `npm run lint` first. Then merge the branch to `main`.

---

### Task 4: Arcade hub

**Branch:** `hub/launcher`

**Files:**
- Create: `apps/hub/package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`
- Create: `apps/hub/src/main.ts`, `src/games.ts`, `src/render.ts`, `src/style.css`
- Test: `apps/hub/tests/games.test.ts`
- Modify: root `package.json` to add `"dev:hub": "npm run dev -w apps/hub"`

**Interfaces:**
- Produces:
  - `interface GameEntry { id; title; description; author; owner; folder; thumbnailUrl; url }`, with all fields strings
  - `validateGame(raw: unknown, jsonPath: string, thumbs: Record<string, string>, base: string): GameEntry`
  - `discoverGames(modules: Record<string, unknown>, thumbs: Record<string, string>, base: string): GameEntry[]`
  - `renderGrid(root: HTMLElement, games: GameEntry[]): void`
- The glob keys look like `../../../games/idham/rpg/game.json`. Owner and folder are the two path segments before `game.json`.
- The thumbnail key is `../../../games/<owner>/<folder>/<thumbnail>`.
- `url` is `${base}games/<owner>/<folder>/`.

- [ ] **Step 1: Write the failing tests.**
  - Fixture: a valid raw object `{ id: 'idham-rpg', title: 'Pixel Quest', description: 'd', thumbnail: 'public/thumbnail.png', author: 'idham', owner: 'idham' }`, with `thumbs = { '../../../games/idham/rpg/public/thumbnail.png': '/t.png' }` and `base = '/pixel-arcade/'`.
  - **valid:** returns the entry with `url === '/pixel-arcade/games/idham/rpg/'` and `thumbnailUrl === '/t.png'`.
  - **errors:** each of the following throws an error whose message contains `games/idham/rpg/game.json`:
    - a missing `title`, or `title: ''`
    - `id: 'rpg'`. The message also contains `expected id "idham-rpg"`.
    - `owner: 'axhad'`
    - a thumbnail not found in `thumbs`
    - a raw value that is not an object
  - **discover:** two valid games titled "Zeta" and "Alpha" come back sorted Alpha, Zeta. An empty input gives `[]`.

- [ ] **Step 2: Run the tests and confirm they fail.**
  - Run: `npm run test -w apps/hub`
  - Expected: FAIL.

- [ ] **Step 3: Implement `src/games.ts`.**
  - These are pure functions with no `import.meta` usage, so tests pass globs in directly.
  - `main.ts` passes `import.meta.glob('../../../games/*/*/game.json', { eager: true, import: 'default' })`.
  - It also passes `import.meta.glob('../../../games/*/*/public/*.png', { eager: true, query: '?url', import: 'default' })` and `import.meta.env.BASE_URL`.

- [ ] **Step 4: Run the tests and confirm they pass.**
  - Run: `npm run test -w apps/hub`
  - Expected: all tests pass.

- [ ] **Step 5: Implement the page, the config and the scripts.**
  - **`render.ts` and `index.html`** (§8):
    - header "Pixel Arcade" and a `<main id="grid">`.
    - each card shows the thumbnail `<img>` (pixelated, alt = title), an `h2` with the title, "by <author>", the description, and `<a class="play" href=url>Play</a>`.
    - with zero games, the grid shows "No games yet — run npm run new-game".
    - set text with `textContent`, never `innerHTML` with data.
  - **`style.css`:**
    - `grid-template-columns: repeat(auto-fill, minmax(220px, 1fr))`.
    - 16 px side padding, dark background.
    - `image-rendering: pixelated`.
  - **`vite.config.ts`:** `base: '/pixel-arcade/'`, `build: { outDir: '../../dist', emptyOutDir: false }`.
  - **Package scripts:** `dev: vite`, `build: vite build`, `typecheck: tsc --noEmit -p .`, `test: vitest run`, `lint: eslint . && prettier --check .`.

- [ ] **Step 6: Verify.**
  - Run: `npm run typecheck -w apps/hub && npm run build -w apps/hub && npm run lint`
  - Expected: exit 0, and `dist/index.html` exists.
  - Run `npm run dev:hub` and confirm Vite prints a local URL. The page shows the empty-state message. Stop the server.

- [ ] **Step 7: Commit.** Message: `feat(hub): auto-discovering arcade launcher`. Then merge the branch to `main`.

---

### Task 5: Game template (logic first, then scenes)

**Branch:** `tooling/template-scaffold`

**Files:**
- Create in `templates/game/`:
  - `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `game.json`, `README.md`
  - `art/sprites.txt`
- Create in `templates/game/src/`:
  - `main.ts`
  - `config/game.ts`
  - `logic/movement.ts`, `logic/collision.ts`, `logic/pool.ts`, `logic/ecs.ts`, `logic/rng.ts`
  - `scenes/PreloadScene.ts`, `scenes/MenuScene.ts`, `scenes/PlayScene.ts`, `scenes/GameOverScene.ts`
  - `systems/input.ts`, `systems/sprites.ts`
- Test: `templates/game/tests/movement.test.ts`, `collision.test.ts`, `pool.test.ts`, `ecs.test.ts`, `rng.test.ts`
- Generated: `templates/game/public/assets/atlas.{png,json}` and `templates/game/public/thumbnail.png`

**Tokens:** `__OWNER__`, `__NAME__`, `__ID__` (`<owner>-<name>`) and `__TITLE__`.
- They appear in `package.json` (`"name": "@pixel-arcade/__ID__"`), `game.json`, `config/game.ts` (`GAME_ID = '__ID__'`, `TITLE = '__TITLE__'`), `index.html` `<title>`, and `README.md`.
- `vite.config.ts` contains **no** tokens. It derives `owner` and `name` from its own folder: `const dir = path.dirname(fileURLToPath(import.meta.url)); const [owner, name] = dir.split(path.sep).slice(-2)`.
  - It then sets `base: /pixel-arcade/games/${owner}/${name}/`, `build.outDir: path.resolve(dir, '../../../dist/games', owner, name)`, `emptyOutDir: true` and `chunkSizeWarningLimit: 1600`.

**Interfaces** (pure, in `src/logic/`, shared by every game made from the template):
- `type Vec2 = { x: number; y: number }`
- `type Rect = { x: number; y: number; w: number; h: number }`
- `clampDt(deltaMs: number): number`: seconds, capped at 0.1, and never negative.
- `step(pos: Vec2, vel: Vec2, dt: number): Vec2`
- `inputToVelocity(dx: -1|0|1, dy: -1|0|1, speed: number): Vec2`: diagonals are normalised.
- `clampToBounds(pos: Vec2, size: Vec2, bounds: Rect): Vec2`
- `overlaps(a: Rect, b: Rect): boolean`: rects that only touch at an edge do **not** overlap.
- `class Pool<T> { constructor(create: () => T, reset: (t: T) => void, max: number); acquire(): T | null; release(t: T): void; get activeCount(): number }`
- `interface Components { position?: Vec2; velocity?: Vec2; size?: Vec2; health?: { hp: number; max: number } }`
- `class World { spawn(c: Components): Entity; remove(id: number): void; query<K extends keyof Components>(...keys: K[]): (Entity & { c: Required<Pick<Components, K>> })[] }`, where `type Entity = { id: number; c: Components }`
- `mulberry32(seed: number): () => number`: returns values in [0, 1).
- `config/game.ts` exports `GAME_ID`, `TITLE`, `WIDTH = 320`, `HEIGHT = 180`, and `SCENES = { Preload: 'Preload', Menu: 'Menu', Play: 'Play', GameOver: 'GameOver' } as const`.
- The GameOver scene receives `{ score: number }` as its init data.

- [ ] **Step 1: Write the failing tests** (one file per logic module):
  - **clampDt:** `clampDt(16)` ≈ 0.016, `clampDt(1000) === 0.1`, `clampDt(-5) === 0`.
  - **step:** `step({x:0,y:0},{x:10,y:-20},0.5)` gives `{x:5,y:-10}`.
  - **inputToVelocity:** `inputToVelocity(1,1,100)` has length ≈ 100. `(0,0)` gives `{x:0,y:0}`.
  - **clampToBounds:** a position past the right or bottom edge is clamped so that `pos + size` stays inside the bounds.
  - **No tunnelling:** speed 2000 px/s and `clampDt(1000)` move at most 200 px.
  - **overlaps:** true for intersecting rects, false for edge-touching rects, true when one contains the other.
  - **Pool:**
    - with `max` = 2, the third `acquire` returns `null`.
    - `release` calls `reset` and makes the item reusable: the same object comes back.
    - `activeCount` tracks acquired items.
  - **World:**
    - `query('position','velocity')` returns only entities that have both.
    - `remove` drops the entity.
    - ids are unique and increasing.
  - **mulberry32:** the same seed gives the same first 5 values, different seeds give different values, and all values are in [0, 1).

- [ ] **Step 2: Run the tests and confirm they fail.**
  - Run: `npx vitest run --root templates/game`
  - Expected: FAIL.

- [ ] **Step 3: Implement the logic modules.**

- [ ] **Step 4: Run the tests and confirm they pass.**
  - Run: `npx vitest run --root templates/game`
  - Expected: all tests pass.

- [ ] **Step 5: Write the art and the scenes.**
  - **Art:** `art/sprites.txt` defines a 12×12 `player`, an 8×8 `coin`, and a 40×24 `thumbnail`. Run `node scripts/make-atlas.mjs templates/game`.
  - **Scenes** (§9):
    - **Preload:**
      - draws a progress bar with `load.on('progress')`.
      - calls `load.setPath(import.meta.env.BASE_URL + 'assets/')` and loads `atlas('atlas', 'atlas.png', 'atlas.json')`.
    - **Menu:**
      - shows the title, `BEST <n>` (from `loadHighScore(GAME_ID)`) and the key hints.
      - starts Play on SPACE, ENTER or a tap.
    - **Play:**
      - the player moves with arrows/WASD, or with a 4-button touch d-pad when `isTouchDevice`.
      - a pooled `Group({ maxSize: 3 })` of coins; each coin collected is +1 score.
      - a 30 s countdown, then GameOver with the score.
      - every frame does `dt = clampDt(delta)`.
    - **GameOver:**
      - calls `recordScore(GAME_ID, score)`.
      - shows `SCORE`, `BEST` and `NEW BEST!` when `isNew`.
      - SPACE or a tap → Play; M → Menu.
  - **Systems:**
    - `systems/input.ts`: `readDirection(keys, touch): { dx: -1|0|1; dy: -1|0|1 }`.
    - `systems/sprites.ts`: `syncSprites(world, sprites: Map<number, Phaser.GameObjects.Sprite>)`.
  - **`index.html`:**
    - a `<a class="back" href="../../../">← Back to arcade</a>` above `<div id="game">`.
    - inline CSS so `#game` fills the remaining viewport height.
  - **`README.md`:** the controls, `npm run dev -w games/__OWNER__/__NAME__`, `npm run art -w …`, and a file map.
  - **`package.json` scripts:** `dev: vite`, `build: vite build`, `preview: vite preview`, `typecheck: tsc --noEmit -p .`, `test: vitest run`, `lint: eslint . && prettier --check .`, `art: node ../../../scripts/make-atlas.mjs .`.

- [ ] **Step 6: Verify.**
  - Run: `npx vitest run --root templates/game && npm run lint`
  - Expected: exit 0.
  - Note: `templates/game/tsconfig.json` extends `../../../tsconfig.base.json`. That path is correct for the depth a game has *after* it is scaffolded (`games/<o>/<g>`), not inside `templates/`. So the template is typechecked through a scaffolded copy by `smoke:template` in Task 7, and Task 7 must not finish until that check passes. Imports of `phaser` and `@pixel-arcade/shared` resolve through the hoisted root `node_modules`.

- [ ] **Step 7: Commit.** Message: `feat(template): starter game with tested logic and four scenes`. Commit the generated PNG and JSON assets too.

---

### Task 6: new-game scaffold

**Branch:** `tooling/template-scaffold`

**Files:**
- Create: `scripts/lib/scaffold.mjs`, `scripts/new-game.mjs`
- Test: `scripts/tests/scaffold.test.mjs`
- Create: `games/idham/.gitkeep`, `games/axhad/.gitkeep`. The owner folders must exist before the scaffold will accept an owner.
- Modify: root `package.json` to add `"new-game": "node scripts/new-game.mjs"`

**Interfaces:**
- Produces:
  - `validateName(name: string): string | null`: returns an error message or `null`. The pattern is `^[a-z][a-z0-9]*(-[a-z0-9]+)*$`.
  - `toTitle(name: string): string`: e.g. `'space-dodge'` → `'Space Dodge'`.
  - `applyTokens(text: string, tokens: Record<string, string>): string`
  - `scaffold({ root, owner, name }): { dir: string }`: throws an `Error` with a user-facing message.
- Tokens are replaced in `.ts`, `.json`, `.html`, `.md` and `.txt` files. All other files are copied byte for byte.

- [ ] **Step 1: Write the failing tests.** Use a temp root built in `os.tmpdir()`, containing a copy of a tiny fake `templates/game` (two files: `game.json` with tokens, and `a.png` with random bytes) and `games/idham/`.
  - **validateName:**
    - `rpg`, `space-dodge` and `snake2` are valid.
    - `RPG`, `../x`, `-x`, `x-`, `a--b`, `a b` and `''` each give an error message.
  - **toTitle:** `'space-dodge'` → `'Space Dodge'`.
  - **scaffold success:**
    - `games/idham/snake/game.json` contains `"id": "idham-snake"` and `"title": "Snake"`.
    - `a.png` is byte-identical to the template copy.
  - **scaffold refusals:** each case below throws, and `games/idham` / `games/<owner>` is left exactly as before:
    - unknown owner `bob` → `/owner folder games\/bob does not exist/`
    - an existing target → `/already exists/`
    - an invalid name

- [ ] **Step 2: Run the tests and confirm they fail.**
  - Run: `npx vitest run --dir scripts`
  - Expected: FAIL.

- [ ] **Step 3: Implement `scripts/lib/scaffold.mjs`.**
  - Validate everything before writing any file.
  - Copy with `fs.cpSync(…, { recursive: true, filter })`, skipping `node_modules`.
  - Then rewrite the text files with `applyTokens`.

- [ ] **Step 4: Run the tests and confirm they pass.**
  - Run: `npx vitest run --dir scripts`
  - Expected: all tests pass.

- [ ] **Step 5: Implement the CLI `scripts/new-game.mjs`.**
  - Usage: `npm run new-game -- <owner> <name>`.
  - On error: print the message and exit 1.
  - On success: print `Created games/<owner>/<name>`, then the next steps: `npm install` and `npm run dev -w games/<owner>/<name>`.

- [ ] **Step 6: Verify.**
  - Run: `npm run new-game -- idham RPG`. Expected: exit 1 and the validation message.
  - Run: `npm run new-game -- bob x`. Expected: exit 1 and the owner message.

- [ ] **Step 7: Commit.** Message: `feat(tooling): new-game scaffold with owner folders`.

---

### Task 7: build-all, preview and template smoke test

**Branch:** `tooling/template-scaffold`

**Files:**
- Create: `scripts/lib/sizes.mjs`, `scripts/build-all.mjs`, `scripts/preview.config.mjs`, `scripts/smoke-template.mjs`
- Test: `scripts/tests/sizes.test.mjs`
- Modify: root `package.json` to add:
  - `"build": "node scripts/build-all.mjs"`
  - `"preview": "vite preview --config scripts/preview.config.mjs"`
  - `"smoke:template": "node scripts/smoke-template.mjs"`

**Interfaces:**
- Produces:
  - `formatBytes(n: number): string`: `512` → `'512 B'`, `2048` → `'2.0 KB'`, `1572864` → `'1.50 MB'`.
  - `measureDir(dir): { raw: number; gzip: number }`: sums file sizes, with gzip computed by `zlib.gzipSync` per file.
  - `formatTable(rows: { name: string; raw: number; gzip: number }[]): string`: produces aligned columns `package | raw | gzip`.
  - `listGameWorkspaces(root): string[]`: posix paths like `games/axhad/fighter`, sorted, including only folders that contain a `package.json`.

- [ ] **Step 1: Write the failing tests.**
  - `formatBytes` returns the three values above.
  - `formatTable` output contains each name and lines up the columns.
  - `listGameWorkspaces`, run on a temp tree, returns `['games/a/x', 'games/b/y']` and ignores `.gitkeep` and folders without a `package.json`.
  - `measureDir`, on a temp dir with two files of known size, reports the right `raw` total, and `gzip > 0`.

- [ ] **Step 2: Run the tests and confirm they fail.**
  - Run: `npx vitest run --dir scripts`
  - Expected: FAIL.

- [ ] **Step 3: Implement `sizes.mjs`.**

- [ ] **Step 4: Run the tests and confirm they pass.**
  - Run: `npx vitest run --dir scripts`
  - Expected: all tests pass.

- [ ] **Step 5: Implement the three scripts.**
  - **`build-all.mjs`:**
    - `rmSync('dist', { recursive: true, force: true })`.
    - spawn `npm run build -w apps/hub`, then `npm run build -w <ws>` for each game workspace, with `stdio: 'inherit'` and `shell: true`.
    - collect the workspaces that fail and keep going.
    - print the size table for the hub (`dist/` excluding `dist/games`) and for each `dist/games/<o>/<g>`.
    - if anything failed: print `FAILED: <list>` and exit 1.
  - **`preview.config.mjs`:** `{ root: <repo root>, base: '/pixel-arcade/', appType: 'mpa', build: { outDir: 'dist' }, preview: { port: 4173 } }`.
  - **`smoke-template.mjs`:**
    - scaffold `idham/smoke-tmp` via `scaffold()`.
    - run `npx tsc --noEmit -p games/idham/smoke-tmp`, then `npx vitest run --root games/idham/smoke-tmp`.
    - always delete the folder in a `finally` block.
    - exit with the failing step's exit code, if any.

- [ ] **Step 6: Verify.**
  - Run: `npm run smoke:template`. Expected: the tsc and vitest passes are printed, `games/idham/smoke-tmp` no longer exists, and the exit code is 0.
  - Run: `npm run build`. Expected: a size table showing the hub, and exit 0.

- [ ] **Step 7: Commit.** Message: `feat(tooling): combined build with size report, preview, template smoke test`. Then merge the branch to `main`.

---

### Task 8: idham/rpg — scaffold and pure logic

**Branch:** `game/idham-rpg/placeholder`

**Files:**
- Generate: run `npm run new-game -- idham rpg`, then `npm install`. In `game.json` and `config/game.ts`, set the title to "Pixel Quest" and write the description.
- Create in `games/idham/rpg/src/logic/`: `score.ts`, `spawn.ts`, `difficulty.ts`, `health.ts`, `ai.ts`
- Test: `games/idham/rpg/tests/` has one file per module

**Interfaces** (the values are pinned by the tests):
- `TILE = 16`. The room is 20×11 tiles.
- `type Tile = { col: number; row: number }`. Walkable interior tiles are col 1..18 and row 1..9.
- `COIN_VALUE = 10`, `MAX_COINS = 3`, `MAX_SLIMES = 8`.
- `scoreForCoins(n: number): number`
- `pickCoinTile(rng: () => number, hero: Tile, occupied: Tile[]): Tile | null`
  - picks uniformly from interior tiles that are not occupied and whose Chebyshev distance from `hero` is ≥ 4.
  - returns `null` when there are none. Build the candidate list first; never retry randomly.
- `slimeSpeed(t: number): number` = `min(20 + 2t, 60)` px/s.
- `spawnInterval(t: number): number` = `max(5 - 0.1t, 1.5)` s.
- `slimeMode(t: number): 'wander' | 'chase'` is `'chase'` when `t >= 30`.
- `type HeroHealth = { hearts: number; invuln: number }`, starting at `{ hearts: 3, invuln: 0 }`.
- `takeHit(h): HeroHealth`: does nothing while `invuln > 0`; otherwise `hearts - 1` and `invuln = 1`.
- `tickHealth(h, dt): HeroHealth`: `invuln` never goes below 0.
- `isDead(h): boolean` is true when `hearts <= 0`.
- `wanderVelocity(rng, speed): Vec2`: one of the 8 compass directions, with length `speed`.
- `chaseVelocity(from: Vec2, to: Vec2, speed): Vec2`: normalised. Returns `{0,0}` when `from` equals `to`.

- [ ] **Step 1: Scaffold the game and confirm the template tests pass in place.**
  - Run: `npm run new-game -- idham rpg && npm install && npm run test -w games/idham/rpg`
  - Expected: the template tests pass.

- [ ] **Step 2: Write the failing tests.**
  - **score:** `scoreForCoins(0) === 0` and `scoreForCoins(7) === 70`.
  - **pickCoinTile:**
    - over 200 seeded calls, every result is inside the interior, at Chebyshev distance ≥ 4 from the hero, and not occupied.
    - when the hero is in the centre and every far tile is occupied, it returns `null`.
    - with a fixed seed it is deterministic.
  - **difficulty:**
    - `slimeSpeed`: 0 → 20, 10 → 40, 100 → 60.
    - `spawnInterval`: 0 → 5, 20 → 3, 100 → 1.5.
    - `slimeMode`: 29.9 → `'wander'`, 30 → `'chase'`.
  - **health:**
    - a hit takes hearts 3 → 2 and sets `invuln` to 1.
    - a second hit at `invuln` 0.5 leaves hearts at 2.
    - `tickHealth(…, 2)` gives `invuln` 0.
    - three spaced-out hits give `isDead`.
  - **ai:**
    - `wanderVelocity` length ≈ speed, with both components in {-1, 0, 1} × speed/√2 or × speed.
    - `chaseVelocity({0,0},{3,4},10)` gives `{6,8}`.
    - `chaseVelocity` of the same point gives `{0,0}`.

- [ ] **Step 3: Run the tests and confirm they fail.**
  - Run: `npm run test -w games/idham/rpg`
  - Expected: the new tests FAIL.

- [ ] **Step 4: Implement the logic modules.**

- [ ] **Step 5: Run the tests and confirm they pass.**
  - Run: `npm run test -w games/idham/rpg`
  - Expected: all tests pass.

- [ ] **Step 6: Commit.** Message: `feat(idham-rpg): scaffold and tested game rules`.

---

### Task 9: idham/rpg — art, scenes, playable

**Branch:** `game/idham-rpg/placeholder`

**Files:**
- Modify: `games/idham/rpg/art/sprites.txt`, `src/scenes/PlayScene.ts`, `src/scenes/MenuScene.ts`, `src/config/game.ts`, `README.md`
- Create: `games/idham/rpg/src/entities/hero.ts`, `entities/slime.ts`, `entities/coin.ts`, `systems/room.ts`

**Interfaces:**
- Consumes everything from Task 8, plus the shared and template exports.

- [ ] **Step 1: Write the art and regenerate the atlas.**
  - Art: an original 16×16 hero (frames `hero-down-0/1`, `hero-up-0/1`, `hero-side-0/1`), `slime-0/1`, `coin-0/1/2`, a 16×16 `floor` and `wall`, an 8×8 `heart`, and a 40×24 `thumbnail` (the hero in the room).
  - Run: `npm run art -w games/idham/rpg`
  - Expected: `atlas … frames` is printed.

- [ ] **Step 2: Implement PlayScene** (§9a).
  - **The room:** tile images from `floor` and `wall`.
  - **The hero:** 8-direction movement via `inputToVelocity` at 80 px/s, kept in the interior with `clampToBounds`.
  - **Coins:** a pooled `Group`, kept topped up to `MAX_COINS` via `pickCoinTile`.
  - **Slimes:** a pooled `Group({ maxSize: MAX_SLIMES })`.
    - spawned on the `spawnInterval(t)` timer at a `pickCoinTile`-chosen tile.
    - speed is `slimeSpeed(t)`, and mode is `slimeMode(t)`.
    - wanderers pick a new `wanderVelocity` every 1.5 s.
  - **Hits:** use `overlaps` with the hit rects. Call `takeHit` on contact, and blink the hero while `invuln > 0`.
  - **HUD:** hearts and score.
  - **End:** when `isDead`, go to GameOver with `{ score: scoreForCoins(coins) }`.
  - **Touch:** the touch d-pad sits bottom-left.

- [ ] **Step 3: Update the Menu hints** ("Arrows/WASD to move · collect coins · avoid slimes") and the README controls.

- [ ] **Step 4: Verify.**
  - Run: `npm run typecheck -w games/idham/rpg && npm run test -w games/idham/rpg && npm run lint`
  - Expected: exit 0.
  - Run: `npm run dev -w games/idham/rpg` and check in the browser:
    - the Preload bar shows, then the Menu.
    - Play works: the hero moves and coins count up.
    - a slime costs a heart; at 0 hearts the GameOver screen shows the best score.
    - a reload keeps the best score.
    - in DevTools device mode, the d-pad works.

- [ ] **Step 5: Commit.** Message: `feat(idham-rpg): playable Pixel Quest placeholder`. Then merge the branch to `main`.

---

### Task 10: axhad/fighter — scaffold and pure logic

**Branch:** `game/axhad-fighter/placeholder`

**Files:**
- Generate: run `npm run new-game -- axhad fighter`, then `npm install`. Set the title to "Pixel Brawl", the author to `axhad` and write the description.
- Create in `games/axhad/fighter/src/logic/`: `combat.ts`, `punch.ts`, `match.ts`, `cpu.ts`, `score.ts`
- Test: `games/axhad/fighter/tests/` has one file per module

**Interfaces** (the values are pinned by the tests):
- **Constants:** `MAX_HP = 100`, `PUNCH_DAMAGE = 10`, `CHIP_RATIO = 0.2`, `ROUND_TIME = 60`, `WINS_NEEDED = 2`, `PUNCH_RANGE = 28`, `BODY = { w: 24, h: 40 }`.
- **Combat:** `resolveHit(defenderHp: number, blocking: boolean): { hp: number; dealt: number }`
  - an unblocked hit deals 10; a blocked hit deals 2.
  - hp never goes below 0, and `dealt` is the damage actually applied.
- **Punch:**
  - `punchPhase(elapsed: number): 'startup' | 'active' | 'recovery' | 'done'`. The phases cover [0, 0.1), [0.1, 0.2), [0.2, 0.4) and ≥ 0.4.
  - `punchHitbox(x: number, y: number, facing: 1 | -1): Rect`. `(x, y)` is the body's top-left corner.
    - the hitbox is a 16×8 rect at `y + 10`.
    - facing 1: `x + BODY.w`. Facing -1: `x - 16`.
  - `canLand(phase, alreadyHit: boolean): boolean`: true only while `'active'` and only if the punch hasn't landed yet.
- **Match:**
  - `type RoundWinner = 'p1' | 'p2' | 'draw'`
  - `roundResult(p1Hp, p2Hp, timeLeft): RoundWinner | null`
    - `null` means the round continues: both have hp > 0 and `timeLeft > 0`.
    - a KO goes to the survivor. A double KO is a draw.
    - on timeout, more hp wins; equal hp is a draw.
  - `interface MatchState { round: number; p1Wins: number; p2Wins: number; timeLeft: number; over: boolean; winner: 'p1' | 'p2' | null }`
  - `newMatch(): MatchState` returns round 1, 0 wins each, `timeLeft` 60, not over.
  - `tickTimer(m, dt): MatchState`: `timeLeft` never goes below 0.
  - `applyRound(m, w: RoundWinner): MatchState`
    - a win increments the winner's tally.
    - every result, including a draw, increments `round` and resets `timeLeft` to 60.
    - reaching `WINS_NEEDED` sets `over` and `winner`.
- **CPU:**
  - `type CpuAction = 'approach' | 'punch' | 'block' | 'idle'`
  - `decideCpu(v: { distance: number; playerPunching: boolean; canAct: boolean }, rng: () => number, level: number): CpuAction`
    - in order: `!canAct` → `idle`; `playerPunching && rng() < blockChance(level)` → `block`; `distance <= PUNCH_RANGE` → `rng() < 0.6 ? 'punch' : 'idle'`; otherwise `approach`.
  - `blockChance(level)` = `min(0.3 + 0.15 × (level − 1), 0.75)`
  - `reactionTime(level)` = `max(0.35 − 0.05 × (level − 1), 0.15)`
- **Score:** `matchScore(damageDealt: number, wonRoundTimeLeft: number[]): number` = `damageDealt + 100 × wonRoundTimeLeft.length + Σ floor(t) × 2`.

- [ ] **Step 1: Scaffold the game and confirm the template tests pass.**
  - Run: `npm run new-game -- axhad fighter && npm install && npm run test -w games/axhad/fighter`
  - Expected: the template tests pass.

- [ ] **Step 2: Write the failing tests.**
  - **resolveHit:** `(100, false)` → `{90, 10}`; `(100, true)` → `{98, 2}`; `(5, false)` → `{0, 5}`.
  - **punchPhase:** 0 → `'startup'`, 0.1 → `'active'`, 0.199 → `'active'`, 0.2 → `'recovery'`, 0.4 → `'done'`.
  - **canLand:** `('active', false)` is true; `('active', true)` and `('startup', false)` are false.
  - **punchHitbox:** `(100, 50, 1)` → `{124, 60, 16, 8}`; `(100, 50, -1)` → `{84, 60, 16, 8}`.
  - **roundResult:** `(50, 40, 10)` → `null`; `(0, 40, 10)` → `'p2'`; `(0, 0, 10)` → `'draw'`; `(30, 20, 0)` → `'p1'`; `(30, 30, 0)` → `'draw'`.
  - **match flow:**
    - p1, p2, p1 gives `over`, winner `'p1'`, round 4.
    - a draw keeps both win counts and increments the round.
    - `tickTimer(newMatch(), 70).timeLeft === 0`.
  - **decideCpu** (use a stub rng returning a fixed value):
    - `canAct: false` gives `'idle'`.
    - a punching player, rng 0.1, level 1 gives `'block'`; rng 0.5, level 1 does not.
    - distance 20 with rng 0.5 gives `'punch'`; with rng 0.7 gives `'idle'`.
    - distance 100 gives `'approach'`.
  - **blockChance / reactionTime:** `blockChance(1) = 0.3`, `blockChance(10) = 0.75`; `reactionTime(1) = 0.35`, `reactionTime(10) = 0.15`.
  - **matchScore:** `(150, [12.9, 0.5]) = 150 + 200 + 24 + 0 = 374`.

- [ ] **Step 3: Run the tests and confirm they fail.**
  - Run: `npm run test -w games/axhad/fighter`
  - Expected: the new tests FAIL.

- [ ] **Step 4: Implement the logic modules.**

- [ ] **Step 5: Run the tests and confirm they pass.**
  - Run: `npm run test -w games/axhad/fighter`
  - Expected: all tests pass.

- [ ] **Step 6: Commit.** Message: `feat(axhad-fighter): scaffold and tested combat/match rules`.

---

### Task 11: axhad/fighter — art, scenes, playable

**Branch:** `game/axhad-fighter/placeholder`

**Files:**
- Modify: `games/axhad/fighter/art/sprites.txt`, `src/scenes/PlayScene.ts`, `MenuScene.ts`, `GameOverScene.ts`, `README.md`
- Create: `games/axhad/fighter/src/entities/fighter.ts`, `entities/spark.ts`, `systems/hud.ts`

**Interfaces:**
- Consumes Task 10.
- GameOver init data is extended to `{ score: number; won: boolean }`.

- [ ] **Step 1: Write the art and regenerate the atlas.**
  - Art: an original 24×40 fighter (`fighter-idle-0/1`, `fighter-walk-0/1`, `fighter-punch-0/1`, `fighter-block`) in two palette variants, `p1-*` and `p2-*`, which share the same grids with a different palette char. Also `spark-0/1/2`, a 320×1 `ground` strip and a 40×24 `thumbnail`.
  - Run: `npm run art -w games/axhad/fighter`
  - Expected: `atlas … frames` is printed.

- [ ] **Step 2: Implement PlayScene** (§9b).
  - **The match:**
    - flat ground at y = 150, with p1 at x = 80 and p2 at x = 216.
    - fighters face each other; the CPU is p2.
    - walking speed is 70 px/s, clamped to the screen.
  - **Controls:**
    - A/D or arrows move, J punches, K blocks.
    - while blocking, a fighter can't move or punch.
  - **The punch:** follows `punchPhase` timing, and lands at most once per punch via `canLand` + `overlaps(punchHitbox, defender body)` → `resolveHit`. Each landed punch spawns a pooled spark (`Group({ maxSize: 6 })`).
  - **The CPU:** calls `decideCpu` every `reactionTime(level)` seconds. `level` is `m.round`.
  - **Rounds:**
    - each frame, `tickTimer` runs, then `roundResult`.
    - on a result: `applyRound`, show "ROUND n" / "KO" / "TIME" for 1.5 s, then reset positions and HP.
  - **End:** when the match is `over`, go to GameOver with `{ score: matchScore(...), won: winner === 'p1' }`.
  - **HUD:** HP bars, a timer and round pips.
  - **Touch:** ◀ ▶ bottom-left, PUNCH and BLOCK bottom-right.

- [ ] **Step 3: GameOver and Menu.**
  - GameOver shows `YOU WIN` / `YOU LOSE` above the template's score/best block.
  - The Menu hints read "A/D move · J punch · K block".
  - Update the README controls.

- [ ] **Step 4: Verify.**
  - Run: `npm run typecheck -w games/axhad/fighter && npm run test -w games/axhad/fighter && npm run lint`
  - Expected: exit 0.
  - Run: `npm run dev -w games/axhad/fighter` and check in the browser:
    - you can punch the CPU, and blocking reduces damage.
    - after a KO the next round starts.
    - best of 3 ends on GameOver, and the best score persists.
    - the touch buttons work in device mode, including holding ▶ while tapping PUNCH.

- [ ] **Step 5: Commit.** Message: `feat(axhad-fighter): playable Pixel Brawl placeholder`. Then merge the branch to `main`.

---

### Task 12: GitHub configuration

**Branch:** `tooling/github-docs`

**Files:**
- Create in `.github/`:
  - `CODEOWNERS` (copy §12 exactly, one path per line)
  - `workflows/ci.yml`, `workflows/deploy.yml`
  - `PULL_REQUEST_TEMPLATE.md`
  - `ISSUE_TEMPLATE/bug.yml`, `ISSUE_TEMPLATE/feature.yml`, `ISSUE_TEMPLATE/new-game-idea.yml`, `ISSUE_TEMPLATE/config.yml`

- [ ] **Step 1: Write `ci.yml`.**
  - Workflow name: `ci`, with a single job id `ci` (the status check name used in the checklist).
  - Triggers: `on: pull_request` and `push: branches: [main]`.
  - Steps on ubuntu-latest:
    1. `actions/checkout@v4`
    2. `actions/setup-node@v4` with `node-version: 24` and `cache: npm`
    3. `npm ci`
    4. `npm run lint`
    5. `npm run typecheck`
    6. `npm test`
    7. `npm run smoke:template`
    8. `npm run build`
  - Set `permissions: contents: read`.

- [ ] **Step 2: Write `deploy.yml`.**
  - Triggers: `push: branches: [main]` and `workflow_dispatch`.
  - Permissions: `contents: read`, `pages: write`, `id-token: write`. Concurrency: `group: pages`, `cancel-in-progress: false`.
  - **build job:** checkout, setup-node 24, `npm ci`, `npm run build`, then `actions/upload-pages-artifact@v3` with `path: dist`.
  - **deploy job:** needs build; uses environment `github-pages` with its URL output; runs `actions/deploy-pages@v4`.

- [ ] **Step 3: Write the PR template and issue forms** (§12).
  - The PR template uses area checkboxes: `games/idham/…`, `games/axhad/…`, hub, shared (needs axhad's review), template, scripts and `.github`.
  - It has three sections: "What changed", "How I tested", and a checklist (lint, typecheck and test pass; one game per PR; didn't edit someone else's game without asking).
  - Issue forms:
    - bug: game dropdown, steps, expected/actual, browser/device.
    - feature: game/area plus a description.
    - new game idea: owner, genre, pitch, controls.
    - `config.yml` sets `blank_issues_enabled: false`.

- [ ] **Step 4: Verify.**
  - Run: `npm run lint`. Expected: exit 0, and Prettier accepts the YAML.
  - Run: `node -e "for (const f of require('fs').readdirSync('.github/workflows')) console.log(f)"`. Expected: both workflow files are listed.
  - Note that the workflows themselves can't run until the repo is pushed (§14a).

- [ ] **Step 5: Commit.** Message: `chore(github): CODEOWNERS, CI, Pages deploy, PR and issue templates`.

---

### Task 13: Docs and final verification

**Branch:** `tooling/github-docs`

**Files:**
- Create: `README.md`, `CONTRIBUTING.md`, `docs/github-settings-checklist.md`
- Create: `games/idham/README.md` ("Games by idham") and `games/axhad/README.md`, replacing the `.gitkeep` files. Deleting `.gitkeep` is part of this task; the owner folders then stay non-empty.

- [ ] **Step 1: Write `README.md`** to cover §13:
  - what the project is, and the live URL pattern `https://<OWNER_USERNAME>.github.io/pixel-arcade/`
  - prerequisites (Node ≥ 22.12) and setup (`npm install`)
  - a scripts table copied from spec §10, plus `smoke:template` and `art`
  - how to run one game; that the back link 404s in a single game's dev server, so use `npm run build && npm run preview` for the full flow
  - how to add a game, the folder layout and the rules
  - build, size report and deploy
  - how to replace the username placeholders, which files hold them, and that `package-lock.json` must be committed

- [ ] **Step 2: Write `CONTRIBUTING.md`** to cover §13 and §14:
  - branch names `game/<owner>-<game>/<feature>`, `hub/…`, `shared/…` and `tooling/…`
  - one game per PR, and never edit another person's game folder without asking
  - how to add a game and how to add a new owner (folder + CODEOWNERS line)
  - shared-code rules: small and backward compatible, with Axhad's review requested on every shared change even when idham bypasses
  - the approval model with its stated trade-offs, and that idham waits for green CI before bypassing
  - commit style

- [ ] **Step 3: Write `docs/github-settings-checklist.md`.** Each step is a checkbox with the exact GitHub menu path:
  1. Create the repo `pixel-arcade` (public). Replace the placeholders. Push `main`.
  2. Settings → Collaborators: add axhad with **Write**. Everyone else stays Read and contributes via forks.
  3. Settings → Rules → Rulesets → New branch ruleset `main`, targeting the default branch:
     - Restrict deletions
     - Block force pushes
     - Require a pull request (1 approval, code-owner review, dismiss stale approvals)
     - Require status checks: `ci`
     - Bypass list: Repository admin, set to "For pull requests only"
  4. Settings → Actions → General: "Require approval for first-time contributors". Workflow permissions: read.
  5. Settings → Pages: Source "GitHub Actions".
  6. First deploy check:
     - the Actions tab shows `deploy` green.
     - the site opens, both cards are shown, both games load, and the back link works.
  7. Open a test PR as axhad to confirm it requires idham's approval.

- [ ] **Step 4: Run the full verification from a clean state** (use superpowers:verification-before-completion). Run each command and paste its real output into the final report:

```
rm -rf node_modules dist && npm install
npm run lint
npm run typecheck
npm test
npm run smoke:template
npm run build          # expect size table: hub, games/axhad/fighter, games/idham/rpg
npm run preview        # open http://localhost:4173/pixel-arcade/ → 2 cards → each game loads → back link returns
npm run dev:hub        # starts; cards show thumbnails
npm run dev -w games/idham/rpg ; npm run dev -w games/axhad/fighter   # each starts
```

  Expected: every command exits 0, the preview click-through works, and `git status` is clean apart from intended changes.

- [ ] **Step 5: Commit.** Message: `docs: README, CONTRIBUTING, GitHub settings checklist`. Then request a code review (superpowers:requesting-code-review), fix any findings, and merge to `main` via superpowers:finishing-a-development-branch.
