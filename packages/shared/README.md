# @pixel-arcade/shared

The only package games may import besides `phaser`.

- `highScoreKey(gameId)`: localStorage key `arcade:<id>:highscore`.
- `loadHighScore(gameId, storage?)`: stored best as a floored integer, or 0 if missing, corrupt or storage is blocked.
- `saveHighScore(gameId, score, storage?)`: writes the score; silently skipped if storage fails.
- `recordScore(gameId, score, storage?)`: saves only a new best and returns `{ best, isNew }`.
- `KeyValueStore`: the `getItem`/`setItem` subset of `Storage` that the helpers accept.
- `pixelScaleConfig(width, height)`: Phaser game config with pixel art, FIT scaling and centering in `#game`.
- `isTouchDevice(scene)`: true when the device reports touch input.
- `addTouchButton(scene, opts)`: on-screen multi-touch button; read `isDown`, call `destroy()` when done.
- `TouchButton`: the interface returned by `addTouchButton`.
