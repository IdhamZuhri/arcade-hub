import type Phaser from 'phaser';
import type { World } from '../logic/ecs';

const COIN_SIZE = 8;

/** Spawn a coin, reusing a pooled sprite. False if the pool is full. */
export function spawnCoin(
  world: World,
  sprites: Map<number, Phaser.GameObjects.Sprite>,
  group: Phaser.GameObjects.Group,
  x: number,
  y: number,
): boolean {
  const sprite = group.get(x, y, 'atlas', 'coin-0') as Phaser.GameObjects.Sprite | null;
  if (!sprite) return false;
  sprite.setOrigin(0).setDepth(3).setPosition(x, y).setActive(true).setVisible(true);
  const e = world.spawn({
    position: { x, y },
    size: { x: COIN_SIZE, y: COIN_SIZE },
    hitbox: { x: 0, y: 0, w: COIN_SIZE, h: COIN_SIZE },
    coin: true,
  });
  sprites.set(e.id, sprite);
  return true;
}

/** Remove a coin entity and return its sprite to the pool. */
export function removeCoin(
  world: World,
  sprites: Map<number, Phaser.GameObjects.Sprite>,
  group: Phaser.GameObjects.Group,
  id: number,
): void {
  const sprite = sprites.get(id);
  world.remove(id);
  sprites.delete(id);
  if (sprite) group.killAndHide(sprite);
}
