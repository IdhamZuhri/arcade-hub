# __TITLE__

A pixel arcade game by __OWNER__ (`__ID__`).

## Controls

- Move: arrow keys or WASD (touch d-pad on touch devices)
- Start / play again: SPACE, ENTER or tap
- Menu from game over: M

## Commands

```
npm run dev -w games/__OWNER__/__NAME__
npm run art -w games/__OWNER__/__NAME__
```

`art` rebuilds the atlas and thumbnail from `art/sprites.txt`.

## File map

- `game.json`: metadata the hub reads
- `art/sprites.txt`: sprite source; generates `public/assets/atlas.*` and `public/thumbnail.png`
- `src/config/game.ts`: id, title, size, scene keys
- `src/logic/`: pure, tested logic (no Phaser)
- `src/scenes/`: Preload, Menu, Play, GameOver
- `src/systems/`: thin Phaser glue for input and sprites
- `tests/`: Vitest tests for `src/logic/`
