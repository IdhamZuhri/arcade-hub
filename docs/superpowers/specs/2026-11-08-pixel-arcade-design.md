# pixel-arcade — Design

Date: 2026-11-08 · Status: draft for approval

## 1. Intent

A public GitHub monorepo that hosts a browser arcade on GitHub Pages. Two siblings, **idham** (repo owner) and **axhad**, each build their own games independently, over time and in any genre. The repo's job is to keep them out of each other's way: each person has a folder of games they own, the hub picks up new games automatically, and CI/CODEOWNERS/conventions act as guardrails. Only the hub and tiny shared tooling are common.

This first round delivers the skeleton plus one small playable placeholder game per person. The real games are built later, by their owners, outside this scope.

### Goals

- Hub page at `/pixel-arcade/` that auto-discovers every game and shows a responsive card grid.
- Two placeholder games, each fully following the per-game architecture rules, playable on desktop and mobile.
- `npm run new-game -- <owner> <name>` creates a new, working game from a template in seconds.
- One `npm run build` → one deployable `dist/`, with per-game bundle sizes reported.
- CI on every PR (lint, typecheck, test, build) and a Pages deploy workflow.
- Contributor docs + a manual GitHub-settings checklist.

### Non-goals

- Real game content (story, levels, roster, balance). Placeholders only.
- Shared engine/framework code between games. `packages/shared` stays tiny.
- Accounts, online leaderboards, backend of any kind.
- A dev proxy that lets the hub dev server open running games (rejected; see Approaches).

### Anti-goals (would count as failure even if it "works")

- One person's change can break or block the other person's game build or dev flow.
- A game importing another game's code.
- Adding a game requires editing a central list.
- Recreating an existing commercial game's characters, art, names or look (the fighter is "in the spirit of" Mortal Kombat; everything is original).

## 2. Constraints (from the owner's spec)

- npm workspaces; Vite + TypeScript (`strict`) in every package; Phaser **3** for games (opt-out only with owner approval).
- Vitest for pure logic; ESLint + Prettier at root.
- **No extra runtime dependencies** beyond Phaser without approval. Dev tooling listed in §6 is part of the agreed stack.
- Games import only from `packages/shared`, never from another game. Shared changes small and backward compatible.
- Test-first for pure game logic; no rendering tests.
- Small commits, one feature per branch, git worktrees.
- Ask before adding dependencies, deleting files, or deviating from the spec.

## 3. Decisions made in conversation

| Topic             | Decision                                                                                                                                                                           |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Owner folders     | `games/<owner>/<game>/` — owners `idham` and `axhad` (first names, not GitHub usernames, so they never change). **Deviation from the spec's flat `games/<game-name>/`, approved.** |
| Placeholder games | idham: top-down 2D RPG → `games/idham/rpg/`. axhad: 1v1 fighting game → `games/axhad/fighter/`.                                                                                    |
| GitHub usernames  | Not known yet. Use literal placeholders `@OWNER_USERNAME` (idham) and `@BROTHER_USERNAME` (axhad) everywhere; checklist says where to replace them.                                |
| License           | MIT, copyright "idham and axhad".                                                                                                                                                  |
| Build approach    | Approach 1 (below).                                                                                                                                                                |

## 4. Approaches considered

1. **Each package is its own Vite app; a root script stitches outputs into one `dist/`** — _chosen._ Strong isolation (a broken game can't break another's dev server), clean per-game bundle sizes, `npm run dev -w <game>` runs one game. Cost: Phaser is bundled per game (~300 KB gz each, cached per game), and hub "Play" links only work against built games, so full click-through is checked with `npm run preview`.
2. **One multi-page Vite app at the root** — rejected. Couples every game to one config; one person's change can break the other's build; murky per-game sizes.
3. **Approach 1 + dev proxy from hub to running game dev servers** — rejected. Extra config plus a process-manager dev dependency; `npm run preview` covers the same need.

## 5. Repository layout

```
pixel-arcade/
  apps/hub/                      @pixel-arcade/hub
  games/
    idham/rpg/                   @pixel-arcade/idham-rpg
    axhad/fighter/               @pixel-arcade/axhad-fighter
  packages/shared/               @pixel-arcade/shared
  templates/game/                not a workspace; copied by new-game
  scripts/                       new-game.mjs, build-all.mjs, check-boundaries.mjs, make-atlas.mjs, preview.mjs
  docs/                          specs, github-settings-checklist.md
  .github/                       CODEOWNERS, workflows/, PULL_REQUEST_TEMPLATE.md, ISSUE_TEMPLATE/
  package.json  tsconfig.base.json  eslint.config.js  .prettierrc  .gitignore  .gitattributes
  README.md  CONTRIBUTING.md  LICENSE
```

Root `package.json` workspaces: `["apps/*", "packages/*", "games/*/*"]`.

### Per-game package

```
games/<owner>/<game>/
  index.html            canvas host + "← Back to arcade" link
  vite.config.ts        base '/pixel-arcade/games/<owner>/<game>/', outDir → <root>/dist/games/<owner>/<game>/
  tsconfig.json         extends ../../../tsconfig.base.json
  package.json          scripts: dev, build, preview, typecheck, test, lint
  game.json             { id, title, description, thumbnail, author, owner }
  README.md             controls, how to run, file map
  art/                  source sprite grids (text) for make-atlas
  public/thumbnail.png  hub card image (generated, committed)
  public/assets/        atlas.png + atlas.json (generated, committed)
  src/
    main.ts             Phaser.Game config
    config/             constants (resolution, speeds, keys)
    scenes/             PreloadScene, MenuScene, PlayScene, GameOverScene
    entities/           entity factories (sprite + components)
    systems/            per-frame systems (movement, AI, combat, spawn) — thin Phaser glue
    logic/              pure TS, no Phaser import: scoring, spawning, difficulty, collision, state rules, pool
  tests/                Vitest specs for logic/
```

## 6. Tooling

- **Dev deps (root):** `typescript`, `vite`, `vitest`, `eslint`, `@eslint/js`, `typescript-eslint`, `eslint-config-prettier`, `globals`, `prettier`. Latest stable versions at install time, pinned by `package-lock.json`.
- **Runtime dep (each game):** `phaser@^3` (latest 3.x).
- `tsconfig.base.json`: `strict`, `noUncheckedIndexedAccess`, `moduleResolution: bundler`, `noEmit`. Each package runs `tsc --noEmit`.
- ESLint flat config at the root covers all packages; Prettier is enforced via `prettier --check` in lint.
- **Boundary check** (`scripts/check-boundaries.mjs`, zero deps, runs as part of `npm run lint`): scans `import` specifiers under `games/*/*/src` and `tests`, resolves relative ones, and fails if any resolves outside that game's own folder. Bare imports are allowed only for `phaser` and `@pixel-arcade/shared`.
- `packages/shared` is consumed as TS source (no build step) via workspace dependency `"@pixel-arcade/shared": "*"`. `phaser` is a peer dependency of shared.
- `.gitattributes`: `* text=auto eol=lf` (the repo is developed on Windows; CI runs on Linux). PNGs are marked `binary`.

## 7. Shared package (`@pixel-arcade/shared`)

Kept deliberately small. Every export has a test where it has logic.

- `storage.ts`: `highScoreKey(gameId)` → `"arcade:<gameId>:highscore"`; `loadHighScore(gameId): number` and `saveHighScore(gameId, score): void`, both wrapped in try/catch and returning 0 / no-op on failure or bad data.
- `scale.ts`: `pixelScaleConfig(width, height)` → a Phaser scale config (FIT, CENTER_BOTH, parent `game`), with `pixelArt: true` settings.
- `input.ts`: `addTouchButton(scene, opts)` → a small on-screen button exposing `isDown`, built on Phaser pointer events (multi-touch). Shown only when the device has touch (`scene.sys.game.device.input.touch`).

**Builder's call:** the high-score `<gameId>` is `game.json` `id`, which is `<owner>-<game>` (e.g. `arcade:idham-rpg:highscore`), so two owners can each have a "snake" without colliding.

## 8. game.json and hub discovery

```json
{
  "id": "idham-rpg",
  "title": "Pixel Quest",
  "description": "…",
  "thumbnail": "public/thumbnail.png",
  "author": "idham",
  "owner": "idham"
}
```

- `id` must equal `<owner>-<folder>`, and `owner` must equal the parent folder name.
- The hub uses `import.meta.glob('../../../games/*/*/game.json', { eager: true })` plus a URL glob over `games/*/*/public/thumbnail.png`, so thumbnails are bundled into the hub and also render in `dev:hub`. A `validateGame()` pure function (tested) checks the required fields and id/folder consistency, and **throws at build time** with a clear message naming the offending file.
- Card link: `./games/<owner>/<game>/` relative to the hub's base `/pixel-arcade/`.
- Hub UI: vanilla TS + CSS, no framework. Header "Pixel Arcade". CSS grid `repeat(auto-fill, minmax(220px, 1fr))`. Each card: pixelated thumbnail, title, "by <author>", description, Play button. Cards are sorted by title. With zero games, it shows a "no games yet" message.
- Game `index.html` back link: `href="../../../"` (resolves to `/pixel-arcade/` in both the build and preview). In a game's own dev server that link 404s; this is documented.

## 9. Per-game architecture (template = both placeholders)

- **Scenes:** Preload → Menu → Play → GameOver → (Menu | Play). Preload draws a progress bar from `load.on('progress')`, then loads `assets/atlas.png/json` (Phaser JSON-hash atlas).
- **Delta time:** every movement uses `dt = delta / 1000` passed into pure functions (`step(pos, vel, dt)`).
- **Entity-component, lightweight:** an entity is a plain record `{ id, components: { position, velocity, health, hitbox, … } }`, plus an optional sprite reference held by the scene. Systems are functions over entity lists; the pure parts live in `logic/`, the Phaser parts (sprite sync, input) in `systems/`. No ECS library.
- **Object pooling:** a pure generic `Pool<T>` in `logic/pool.ts` (acquire/release, tested), plus Phaser `Group` with `maxSize` and `get()` / `killAndHide()` for sprites (RPG coins and slimes, fighter hit sparks).
- **Sprite atlases:** `scripts/make-atlas.mjs` (zero deps, uses Node `zlib` to write PNG) reads `art/sprites.txt` (named ASCII grids + palette) and writes `public/assets/atlas.png` and `atlas.json`, plus a 2× `thumbnail.png` from a named sprite. Output is committed; run via `npm run art -w <game>`.
- **Controls:** keyboard and touch buttons. Desktop shows key hints on the Menu screen; touch devices show on-screen buttons.
- **Responsive:** logical resolution 320×180, Scale FIT, pixelArt, centered; the page background fills the viewport. Works in portrait (letterboxed) and landscape.
- **High score:** via shared `loadHighScore` / `saveHighScore`. Shown on Menu and GameOver; "NEW BEST!" when beaten.

### 9a. idham/rpg — "Pixel Quest" (placeholder)

- One room: tiled floor, wall border. The hero moves in 8 directions (arrows/WASD; touch: 4-button d-pad bottom-left).
- Coins spawn at random free tiles, not within 3 tiles of the hero; at most 3 at a time. Each coin is worth +10.
- Slimes wander (random direction changes) and later chase. One spawns every N seconds; difficulty raises slime speed and spawn rate over time, with caps.
- The hero has 3 hearts; touching a slime costs 1 heart, then 1 s of invulnerability. At 0 hearts → GameOver. Score = coins × 10.
- **Pure logic + tests:** scoring, coin spawn placement (seeded RNG), difficulty curve, AABB overlap, wall clamping, invulnerability timer, pool.

### 9b. axhad/fighter — "Pixel Brawl" (placeholder)

- Side view, flat stage, two original fighters (palette-swapped). Player vs a simple CPU.
- Controls: A/D (or arrows) move, J punch, K block; touch: left/right buttons bottom-left, Punch/Block bottom-right.
- Punch: short startup, an active hitbox, recovery. A blocked hit deals 20% chip damage. 100 HP each; a 60 s round timer; best of 3 rounds; a timeout goes to the fighter with more HP (a draw replays the round).
- CPU: a pure decision function `(state, rng) → action` (approach, punch in range, block sometimes when the player is punching), with a reaction delay. Difficulty rises each round.
- Score = damage dealt + 100 per round won + remaining seconds × 2 in won rounds; the high score is the best match score. GameOver shows WIN/LOSE.
- **Pure logic + tests:** damage/block calc, hitbox overlap, punch frame timing, round/match state machine, timer/timeout rules, CPU decision (seeded), scoring, pool.

## 10. Scripts (root package.json)

| Script                        | Does                                                                                                                                                                                           |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dev:hub`                     | `vite` in apps/hub                                                                                                                                                                             |
| `dev -w games/<owner>/<game>` | that game's own Vite dev server (each package defines `dev`)                                                                                                                                   |
| `new-game -- <owner> <name>`  | `scripts/new-game.mjs` (see §11)                                                                                                                                                               |
| `build`                       | `scripts/build-all.mjs`: delete `dist/`; build hub → `dist/`; build each game workspace (discovered by glob) → `dist/games/<owner>/<game>/`; print a size table (raw + gzip per game, and hub) |
| `preview`                     | serve `dist/` at `/pixel-arcade/` via `vite preview` with a config pointing at `dist/`                                                                                                         |
| `lint`                        | `eslint .` + `prettier --check .` + boundary check                                                                                                                                             |
| `format`                      | `prettier --write .`                                                                                                                                                                           |
| `typecheck`                   | `npm run typecheck --workspaces --if-present`                                                                                                                                                  |
| `test`                        | `npm run test --workspaces --if-present` (`vitest run`)                                                                                                                                        |
| per-game                      | `npm run <lint\|typecheck\|test\|build> -w games/<owner>/<game>`                                                                                                                               |

If any game build fails, `build-all` exits non-zero, after reporting which one failed.

## 11. new-game scaffold

`npm run new-game -- <owner> <name>`:

- Validates `name` as kebab-case `[a-z][a-z0-9-]*`, requires `games/<owner>/` to exist (so a typo can't invent a new owner), and refuses if the target exists.
- Copies `templates/game/` and replaces tokens `__OWNER__`, `__NAME__`, `__ID__`, `__TITLE__` in text files.
- Prints next steps (`npm install`, then `npm run dev -w games/<owner>/<name>`).
- The template is a minimal runnable game: all four scenes, a sprite you can move, a pickup, score, high score, touch button, atlas, one passing logic test. The RPG and fighter start from this template, so its structure is identical.
- New owners are added manually: create the folder, add a CODEOWNERS line (documented in CONTRIBUTING).
- **Builder's call:** CI scaffolds a throwaway game and typechecks/tests it so the template can't rot. It runs as a step in the CI workflow and deletes the game afterwards.

## 12. GitHub files

- **CODEOWNERS** (placeholders `@OWNER_USERNAME` = idham, `@BROTHER_USERNAME` = axhad; approval model in §14):
  ```
  *                   @OWNER_USERNAME
  /games/idham/       @OWNER_USERNAME
  /games/axhad/       @BROTHER_USERNAME @OWNER_USERNAME
  /packages/shared/   @OWNER_USERNAME @BROTHER_USERNAME
  /apps/hub/  /templates/  /scripts/  /.github/   @OWNER_USERNAME
  ```
  (one line per path in the real file; later lines override earlier ones.)
- **ci.yml:** on `pull_request` and push to `main`; ubuntu, Node 24, `npm ci`, lint, typecheck, test, template smoke test, build.
- **deploy.yml:** on push to `main` and manual dispatch; build, `actions/upload-pages-artifact` with `dist/`, `actions/deploy-pages`; permissions `pages: write`, `id-token: write`; concurrency group `pages`.
- **PULL_REQUEST_TEMPLATE.md:** area-touched checkboxes (my game / other's game (with permission) / hub / shared / template / scripts / .github), summary, a "how I tested" section, and a checklist (lint/typecheck/test pass, one game per PR).
- **ISSUE_TEMPLATE/:** `bug.yml`, `feature.yml`, `new-game-idea.yml` (issue forms), plus `config.yml`.

## 13. Docs

- **README.md:** what it is, live URL pattern, prerequisites (Node ≥ 22), setup, the scripts table, running one game, adding a game, folder layout, rules, build and preview, deploy, and replacing the username placeholders.
- **CONTRIBUTING.md:** branch naming `game/<owner>-<game>/<feature>` (adapted from the spec's `game/<game-name>/<feature>` to carry the owner) plus `hub/<feature>`, `shared/<feature>` and `tooling/<feature>`; one game per PR; never edit another person's game folder without asking; how to add a game; how to add an owner; shared-code rules; commit message style.
- **docs/github-settings-checklist.md:** manual steps: protect `main` (ruleset), require PRs, require code-owner review, require passing CI (`ci` job), block force pushes and deletions, give axhad Write access, outsiders stay Read and contribute via forks, require approval for first-time contributor workflows, set Pages source to GitHub Actions, replace placeholders. It also covers how the approval rules interact for a two-person team (§14).

## 14. Approval model (decided: option C)

GitHub never lets a PR's author approve their own PR, so a two-person team needs a deliberate model. The owner chose **C: approvals required, repo owner can bypass.**

- The `main` ruleset requires a PR, 1 approval, code-owner review, and the passing `ci` check; it blocks force pushes and deletions.
- The bypass list contains only the Repository admin role (idham), in **"For pull requests only"** mode. idham still opens PRs (CI runs, history stays clean) but can merge without an approval. The checklist and CONTRIBUTING ask him to wait for green CI before bypassing.
- axhad has no bypass. His PRs need approval from a code owner other than him; idham is listed on `games/axhad/` and `packages/shared/` for exactly that reason.
- **Accepted trade-offs, stated in CONTRIBUTING and the checklist:** idham's changes to `packages/shared/` are not forced through axhad's review, and "don't edit axhad's folder without asking" is a team rule for idham rather than something GitHub enforces. axhad editing `games/idham/` does need idham's approval.
- Fork PRs from outsiders need one code-owner approval, like any other PR.
- Option A (mutual approval, no bypass) and option B (no approvals required) were considered. A was the recommendation; the owner preferred C for speed on his own work.

## 14a. Repository bootstrap (builder's call)

No GitHub repo exists yet. Run `git init -b main` locally, commit this spec first, then build each feature on its own branch in a worktree and merge it locally into `main` in order (no PRs, since there's no remote). The owner later creates a GitHub repo named exactly `pixel-arcade` (the base path depends on it) and pushes; `ci.yml` and `deploy.yml` first run then. The checklist includes the first-push and first-deploy verification.

## 15. Left to the builder

- Exact pixel art, palettes, titles, and copy text.
- Tuning numbers (speeds, spawn rates, frame data).
- Internal function signatures and file splits within the structure above.
- The size-table formatting.
- Commit granularity within each feature branch, and the order of worktree branches (proposed: tooling-root → shared → hub → template + scaffold → rpg → fighter → github + docs).

## 16. Done means

`npm install`, `npm run lint`, `npm run typecheck`, `npm test` and `npm run build` all pass locally, with real output shown. `npm run preview` serves the hub with two cards, each opens its game, and the back link returns to the hub. `npm run dev:hub` and `npm run dev -w games/idham/rpg` / `-w games/axhad/fighter` each start. `new-game` creates a game that passes typecheck and test. README and checklist complete.
