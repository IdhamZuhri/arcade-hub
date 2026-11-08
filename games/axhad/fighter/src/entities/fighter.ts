import type Phaser from 'phaser';
import { fighterFrame } from '../logic/anim';
import type { World } from '../logic/ecs';
import { FIGHTER_TOP, newFighter, type FighterComponents } from '../logic/fighter';

export type Skin = 'p1' | 'p2';
export type FighterEntity = { id: number; c: FighterComponents & { skin: Skin } };

export function spawnFighter(
  scene: Phaser.Scene,
  world: World,
  sprites: Map<number, Phaser.GameObjects.Sprite>,
  skin: Skin,
  x: number,
  facing: 1 | -1,
): FighterEntity {
  const c = { ...newFighter(x, facing), skin };
  const e = world.spawn(c);
  sprites.set(e.id, scene.add.sprite(x, FIGHTER_TOP, 'atlas', `${skin}-idle-0`).setOrigin(0));
  return { id: e.id, c };
}

/** Mirroring and animation frame; syncSprites sets the position. */
export function drawFighter(
  sprite: Phaser.GameObjects.Sprite | undefined,
  c: FighterEntity['c'],
): void {
  if (!sprite) return;
  sprite.setFlipX(c.facing === -1);
  const frame = fighterFrame({
    blocking: c.blocking,
    punchT: c.punchT,
    moving: c.anim.moving,
    animT: c.anim.t,
  });
  sprite.setFrame(`${c.skin}-${frame}`);
}
