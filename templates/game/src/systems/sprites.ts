import type Phaser from 'phaser';
import type { World } from '../logic/ecs';

/** Copy ECS positions onto their sprites; drop sprites whose entity is gone. */
export function syncSprites(world: World, sprites: Map<number, Phaser.GameObjects.Sprite>): void {
  const live = new Set<number>();
  for (const e of world.query('position')) {
    live.add(e.id);
    sprites.get(e.id)?.setPosition(e.c.position.x, e.c.position.y);
  }
  for (const [id, sprite] of sprites) {
    if (!live.has(id)) {
      sprite.destroy();
      sprites.delete(id);
    }
  }
}
