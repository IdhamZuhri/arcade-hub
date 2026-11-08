import Phaser from 'phaser';
import { SLIME_REPICK, TILE, ROOM_COLS, ROOM_ROWS } from '../config/game';
import { chaseVelocity, wanderVelocity } from '../logic/ai';
import { clampToBounds, step, type Rect, type Vec2 } from '../logic/movement';

const BOUNDS: Rect = { x: TILE, y: TILE, w: (ROOM_COLS - 2) * TILE, h: (ROOM_ROWS - 2) * TILE };

export class Slime extends Phaser.GameObjects.Sprite {
  private vel: Vec2 = { x: 0, y: 0 };
  private repick = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'atlas', 'slime-0');
    this.setOrigin(0).setDepth(4);
  }

  /** (Re)activate at a tile's top-left pixel. */
  place(x: number, y: number): void {
    this.setPosition(x, y).setActive(true).setVisible(true);
    this.repick = 0;
  }

  tick(
    dt: number,
    time: number,
    speed: number,
    mode: 'wander' | 'chase',
    target: Vec2,
    rng: () => number,
  ): void {
    this.repick -= dt;
    if (mode === 'chase') {
      this.vel = chaseVelocity({ x: this.x + TILE / 2, y: this.y + TILE / 2 }, target, speed);
    } else if (this.repick <= 0) {
      this.vel = wanderVelocity(rng, speed);
      this.repick = SLIME_REPICK;
    }
    const p = step({ x: this.x, y: this.y }, this.vel, dt);
    const c = clampToBounds(p, { x: TILE, y: TILE }, BOUNDS);
    if (c.x !== p.x || c.y !== p.y) this.repick = 0; // hit a wall: pick a new heading
    this.setPosition(c.x, c.y);
    this.setFrame(Math.floor(time / 300) % 2 === 0 ? 'slime-0' : 'slime-1');
  }

  hitRect(): Rect {
    return { x: this.x + 2, y: this.y + 5, w: 12, h: 9 };
  }
}
