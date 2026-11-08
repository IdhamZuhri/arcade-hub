# Fighter

Pixel Brawl: a 1v1 pixel fighting game by axhad (`axhad-fighter`).

## Controls

- Move: A/D or arrow keys (touch: < > buttons)
- Punch: J (touch: PUNCH)
- Block: K (touch: BLOCK); no moving or punching while blocking
- Best of 3 rounds vs the CPU, tougher each round
- Start / play again: SPACE, ENTER or tap
- Menu from game over: M

## Commands

```
npm run dev -w games/axhad/fighter
npm run art -w games/axhad/fighter
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
