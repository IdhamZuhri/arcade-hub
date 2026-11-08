# pixel-arcade

A small browser arcade of pixel-art games, built with Phaser 3 and Vite and published on GitHub Pages. It is owned by two siblings, idham (repo owner) and axhad. A launcher hub discovers every game automatically.

Live site: `https://<OWNER_USERNAME>.github.io/pixel-arcade/` (replace `<OWNER_USERNAME>` with idham's GitHub username).

Games today:

- **Pixel Quest** (`games/idham/rpg`) by idham
- **Pixel Brawl** (`games/axhad/fighter`) by axhad

## Prerequisites and setup

- Node.js 22.12 or newer
- npm (ships with Node)

```
npm install
```

## Scripts

Run from the repo root.

| Script                                | Does                                                                                                                                   |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run dev:hub`                     | Vite dev server for the hub (`apps/hub`)                                                                                               |
| `npm run dev -w games/<owner>/<game>` | That game's own Vite dev server                                                                                                        |
| `npm run new-game -- <owner> <name>`  | Scaffold a new game from `templates/game`                                                                                              |
| `npm run build`                       | Delete `dist/`, build the hub into `dist/`, build every game into `dist/games/<owner>/<game>/`, then print a size table (raw and gzip) |
| `npm run preview`                     | Serve `dist/` at http://localhost:4173/pixel-arcade/                                                                                   |
| `npm run lint`                        | `eslint .`, `prettier --check .` and the boundary check                                                                                |
| `npm run format`                      | `prettier --write .`                                                                                                                   |
| `npm run typecheck`                   | `tsc --noEmit` in every workspace                                                                                                      |
| `npm test`                            | Script tests, then `vitest run` in every workspace                                                                                     |
| `npm run smoke:template`              | Scaffold a throwaway game from the template, check it, then delete it                                                                  |
| per game                              | `npm run <dev\|build\|test\|typecheck\|lint\|art> -w games/<owner>/<game>`                                                             |

`art` rebuilds a game's atlas and thumbnail from `art/sprites.txt`. If any game build fails, `npm run build` reports which one and exits non-zero.

## Running one game

```
npm run dev -w games/idham/rpg
npm run dev -w games/axhad/fighter
```

In a single game's dev server the "Back to arcade" link points at a hub that is not running there, so it returns 404. To try the whole flow (hub, game, back link) use:

```
npm run build
npm run preview
```

then open http://localhost:4173/pixel-arcade/.

## Adding a game

```
npm run new-game -- <owner> <name>
npm install
npm run dev -w games/<owner>/<name>
```

`<owner>` must be an existing folder under `games/` (`idham` or `axhad`), so a typo cannot invent an owner. `<name>` must match `^[a-z][a-z0-9]*(-[a-z0-9]+)*$`: lowercase letters and digits, starting with a letter, with single hyphens between parts (no leading, trailing or double hyphens). The script refuses if the game already exists. The hub finds the new game on the next build through its `game.json`; no hub edit is needed.

## Layout

```
apps/hub/             launcher; discovers games via game.json
games/<owner>/<game>/ one npm workspace per game
packages/shared/      helpers consumed as TypeScript source
templates/game/       copied by new-game (not a workspace)
scripts/              new-game, build-all, preview config, smoke-template, make-atlas, check-boundaries
docs/                 specs and the GitHub settings checklist
.github/              CODEOWNERS, ci.yml, deploy.yml, PR and issue templates
```

Each game folder holds `index.html`, `vite.config.ts`, `game.json`, `README.md`, `art/`, `public/`, `src/` and `tests/`.

## Rules

- A game may import only relative files inside its own folder, plus `phaser`, `@pixel-arcade/shared` and (in tests) `vitest`. `npm run lint` enforces this.
- `src/logic/**` is pure TypeScript and must not import `phaser` or `@pixel-arcade/shared`.
- Logical resolution is 320x180 with `pixelArt: true`.
- Each frame's delta time is clamped to 0.1 s.
- The high score is stored in `localStorage` under `arcade:<owner>-<game>:highscore` (for example `arcade:idham-rpg:highscore`).
- Phaser stays pinned at `3.90.0`.

See [CONTRIBUTING.md](CONTRIBUTING.md) for branches, reviews and commit style.

## Build, size report and deploy

`npm run build` prints a table of raw and gzip sizes for the hub and each game. CI (`.github/workflows/ci.yml`) runs on every pull request and on pushes to `main`: install, lint, typecheck, test, template smoke test, build.

Pushing to `main` runs `.github/workflows/deploy.yml`, which builds and publishes `dist/` to GitHub Pages. It can also be run manually. The repository must be named exactly `pixel-arcade`, because the base path `/pixel-arcade/` depends on it.

## First-time GitHub setup

1. Replace the username placeholders. `@OWNER_USERNAME` (idham) and `@BROTHER_USERNAME` (axhad) appear in `.github/CODEOWNERS`, the only file that uses them (this README's `<OWNER_USERNAME>` is just documentation). Replace them with the real GitHub usernames. A username that does not exist makes CODEOWNERS invalid, so do this before the branch rules matter.
2. Keep `package-lock.json` committed (update it whenever you `npm install`). CI and deploy use `npm ci`, which needs it.
3. Follow [docs/github-settings-checklist.md](docs/github-settings-checklist.md) for collaborators, labels, the `main` ruleset and Pages.

## License

MIT, Copyright (c) 2026 idham and axhad.
