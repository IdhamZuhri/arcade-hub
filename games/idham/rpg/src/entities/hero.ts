import type Phaser from 'phaser';
import { HERO_HIT, START_HEARTS, TILE } from '../config/game';
import { blinkVisible, heroFrame } from '../logic/anim';
import type { World } from '../logic/ecs';
import type { With } from '../logic/rules';

export type HeroComponents = With<
  'position' | 'velocity' | 'size' | 'health' | 'invuln' | 'hitbox' | 'anim'
>;
export type HeroEntity = { id: number; c: HeroComponents };

/** Hit area is smaller than the sprite so slime contact feels fair. */
const HIT_OFFSET = (TILE - HERO_HIT) / 2;

export function spawnHero(
  scene: Phaser.Scene,
  world: World,
  sprites: Map<number, Phaser.GameObjects.Sprite>,
  x: number,
  y: number,
): HeroEntity {
  const c: HeroComponents = {
    position: { x, y },
    velocity: { x: 0, y: 0 },
    size: { x: TILE, y: TILE },
    health: { hp: START_HEARTS, max: START_HEARTS },
    invuln: 0,
    hitbox: { x: HIT_OFFSET, y: HIT_OFFSET, w: HERO_HIT, h: HERO_HIT },
    anim: { facing: 'down', walkT: 0, flipX: false },
  };
  const e = world.spawn(c);
  sprites.set(e.id, scene.add.sprite(x, y, 'atlas', 'hero-down-0').setOrigin(0).setDepth(5));
  return { id: e.id, c };
}

/** Frame, mirroring and the invulnerability blink; syncSprites sets the position. */
export function drawHero(sprite: Phaser.GameObjects.Sprite | undefined, c: HeroComponents): void {
  sprite?.setFrame(heroFrame(c.anim)).setFlipX(c.anim.flipX).setVisible(blinkVisible(c.invuln));
}
