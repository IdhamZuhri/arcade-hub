import type Phaser from 'phaser';
import { TILE } from '../config/game';
import type { World } from '../logic/ecs';

/** Spawn a slime at a tile's top-left pixel, reusing a pooled sprite. False if the pool is full. */
export function spawnSlime(
  world: World,
  sprites: Map<number, Phaser.GameObjects.Sprite>,
  group: Phaser.GameObjects.Group,
  x: number,
  y: number,
): boolean {
  const sprite = group.get(x, y, 'atlas', 'slime-0') as Phaser.GameObjects.Sprite | null;
  if (!sprite) return false;
  sprite.setOrigin(0).setDepth(4).setPosition(x, y).setActive(true).setVisible(true);
  const e = world.spawn({
    position: { x, y },
    velocity: { x: 0, y: 0 },
    size: { x: TILE, y: TILE },
    hitbox: { x: 2, y: 5, w: 12, h: 9 },
    slime: { repick: 0 },
  });
  sprites.set(e.id, sprite);
  return true;
}
