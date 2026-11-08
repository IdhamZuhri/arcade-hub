import Phaser from 'phaser';
import { HERO_HIT, HERO_SPEED, START_HEARTS, TILE, ROOM_COLS, ROOM_ROWS } from '../config/game';
import type { HeroHealth } from '../logic/health';
import { clampToBounds, inputToVelocity, step, type Rect } from '../logic/movement';

const BOUNDS: Rect = { x: TILE, y: TILE, w: (ROOM_COLS - 2) * TILE, h: (ROOM_ROWS - 2) * TILE };

export class Hero {
  readonly sprite: Phaser.GameObjects.Sprite;
  health: HeroHealth = { hearts: START_HEARTS, invuln: 0 };
  private x: number;
  private y: number;
  private facing: 'down' | 'up' | 'side' = 'down';
  private walked = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.x = x;
    this.y = y;
    this.sprite = scene.add.sprite(x, y, 'atlas', 'hero-down-0').setOrigin(0).setDepth(5);
  }

  move(dx: -1 | 0 | 1, dy: -1 | 0 | 1, dt: number): void {
    const v = inputToVelocity(dx, dy, HERO_SPEED);
    const p = clampToBounds(step({ x: this.x, y: this.y }, v, dt), { x: TILE, y: TILE }, BOUNDS);
    this.walked = dx || dy ? this.walked + dt : 0;
    this.x = p.x;
    this.y = p.y;
    if (dx !== 0) {
      this.facing = 'side';
      this.sprite.setFlipX(dx < 0);
    } else if (dy !== 0) {
      this.facing = dy < 0 ? 'up' : 'down';
    }
    const frame = Math.floor(this.walked * 6) % 2;
    this.sprite.setFrame(`hero-${this.facing}-${frame}`).setPosition(this.x, this.y);
    // Blink while invulnerable.
    this.sprite.setVisible(
      this.health.invuln <= 0 || Math.floor(this.health.invuln * 10) % 2 === 0,
    );
  }

  center(): { x: number; y: number } {
    return { x: this.x + TILE / 2, y: this.y + TILE / 2 };
  }

  tile(): { col: number; row: number } {
    const c = this.center();
    return { col: Math.floor(c.x / TILE), row: Math.floor(c.y / TILE) };
  }

  /** Smaller than the sprite so slime contact feels fair. */
  hitRect(): Rect {
    const o = (TILE - HERO_HIT) / 2;
    return { x: this.x + o, y: this.y + o, w: HERO_HIT, h: HERO_HIT };
  }
}
