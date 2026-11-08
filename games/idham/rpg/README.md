# Pixel Quest

A pixel arcade game by idham (`idham-rpg`).

## Controls

- Move: arrow keys or WASD (touch d-pad bottom-left on touch devices)
- Goal: collect coins (10 points each) and avoid slimes; you have 3 hearts
- Slimes wander at first, then chase after 30 s and get faster
- Start / play again: SPACE, ENTER or tap
- Menu from game over: M

## Commands

```
npm run dev -w games/idham/rpg
npm run art -w games/idham/rpg
```

`art` rebuilds the atlas and thumbnail from `art/sprites.txt`.

## File map

- `game.json`: metadata the hub reads
- `art/sprites.txt`: sprite source; generates `public/assets/atlas.*` and `public/thumbnail.png`
- `src/config/game.ts`: id, title, size, scene keys
- `src/logic/`: pure, tested logic (no Phaser)
- `src/scenes/`: Preload, Menu, Play, GameOver
- `src/entities/`: Phaser sprites for hero, slime, coin
- `src/systems/`: input, sprite sync and room building
- `tests/`: Vitest tests for `src/logic/`
