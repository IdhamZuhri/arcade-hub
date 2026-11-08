# Contributing

Thanks for helping with pixel-arcade. Setup and scripts are in [README.md](README.md).

## Branches

Branch from `main` and open a pull request. Names:

- `game/<owner>-<game>/<feature>`, for example `game/axhad-fighter/combo-meter`
- `hub/<feature>`
- `shared/<feature>`
- `tooling/<feature>`

## Pull requests

- One game per PR.
- Do not edit another person's game folder without asking them first.
- `npm run lint`, `npm run typecheck` and `npm test` must pass. CI (`ci`) runs the same checks plus `smoke:template` and `build`.

## Adding a game

```
npm run new-game -- <owner> <name>
npm install
npm run dev -w games/<owner>/<name>
```

Edit the generated `game.json`, art and logic, and run `npm run art -w games/<owner>/<name>` after changing `art/sprites.txt`. Games may import only files inside their own folder, `phaser`, `@pixel-arcade/shared` and (in tests) `vitest`.

## Adding a new owner

`new-game` refuses unknown owners, so an owner is added by hand:

1. Create `games/<owner>/` with a `README.md` (like `games/idham/README.md`) so the folder stays tracked and non-empty.
2. Add a line to `.github/CODEOWNERS` such as `/games/<owner>/  @<owner> @OWNER_USERNAME`, using real usernames. Later lines override earlier ones.
3. Give the new owner Write access (see the settings checklist).

## Shared code

`packages/shared` is used by every game, so changes must be small and backward compatible. Request axhad's review on every shared change, even when idham could bypass the approval rule.

## Approval model

GitHub never lets an author approve their own PR, so the `main` ruleset works like this:

- It requires a pull request, 1 approval, code-owner review and the passing `ci` check. Force pushes and deletions are blocked.
- The bypass list is Repository admin only, in "For pull requests only" mode. idham can merge his own PRs without an approval. He still opens the PR and waits for CI to go green before merging.
- axhad has no bypass. His PRs need idham's approval (idham is a code owner of `games/axhad/` and `packages/shared/` for this reason).
- Fork PRs from outsiders need one code-owner approval.

Trade-offs we accept:

- idham's changes to `packages/shared` are not forced through axhad's review, so idham should request it anyway.
- "Don't edit axhad's folder without asking" is a team rule for idham. GitHub does not enforce it. axhad editing `games/idham/` does need idham's approval.

## Commits

Short, imperative, conventional-style subjects with a scope for the area touched, for example `feat(axhad-fighter): add combo meter`, `fix(hub): handle missing thumbnail`, `docs: update README`. Keep commits small.
