import type Phaser from 'phaser';
import type { World } from '../logic/ecs';

/** Spawn a hit spark, reusing a pooled sprite. Does nothing if the pool is full. */
export function spawnSpark(
  world: World,
  sprites: Map<number, Phaser.GameObjects.Sprite>,
  group: Phaser.GameObjects.Group,
  x: number,
  y: number,
): void {
  const s = group.get(x, y, 'atlas', 'spark-0') as Phaser.GameObjects.Sprite | null;
  if (!s) return;
  s.setPosition(x, y).setDepth(5).setFrame('spark-0').setActive(true).setVisible(true);
  const e = world.spawn({ position: { x, y }, spark: { age: 0 } });
  sprites.set(e.id, s);
}

/** Remove a spark entity and return its sprite to the pool. */
export function removeSpark(
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
