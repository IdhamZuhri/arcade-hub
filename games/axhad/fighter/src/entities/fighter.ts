import type Phaser from 'phaser';
import { BODY, MAX_HP } from '../config/game';
import { fighterFrame } from '../logic/anim';
import { canLand, punchHitbox, punchPhase, type PunchPhase } from '../logic/punch';
import type { Rect } from '../logic/movement';

export const GROUND_Y = 150;
export const WALK_SPEED = 70;
const TOP = GROUND_Y - BODY.h;

export interface FighterInput {
  move: -1 | 0 | 1;
  /** True only on the frame a punch is requested. */
  punch: boolean;
  block: boolean;
}

export class Fighter {
  x: number;
  hp = MAX_HP;
  facing: 1 | -1;
  blocking = false;
  /** Seconds since the current punch began; -1 when not punching. */
  punchT = -1;
  alreadyHit = false;
  private moving = false;
  private animT = 0;
  readonly sprite: Phaser.GameObjects.Sprite;

  constructor(
    scene: Phaser.Scene,
    private readonly prefix: 'p1' | 'p2',
    private readonly startX: number,
    private readonly startFacing: 1 | -1,
  ) {
    this.x = startX;
    this.facing = startFacing;
    this.sprite = scene.add.sprite(startX, TOP, 'atlas', `${prefix}-idle-0`).setOrigin(0);
  }

  reset(): void {
    this.x = this.startX;
    this.facing = this.startFacing;
    this.hp = MAX_HP;
    this.blocking = false;
    this.punchT = -1;
    this.alreadyHit = false;
    this.moving = false;
    this.animT = 0;
    this.syncSprite();
  }

  get punching(): boolean {
    return this.punchT >= 0;
  }

  get phase(): PunchPhase {
    return this.punching ? punchPhase(this.punchT) : 'done';
  }

  get body(): Rect {
    return { x: this.x, y: TOP, w: BODY.w, h: BODY.h };
  }

  get hitbox(): Rect {
    return punchHitbox(this.x, TOP, this.facing);
  }

  get canLandPunch(): boolean {
    return this.punching && canLand(this.phase, this.alreadyHit);
  }

  update(dt: number, input: FighterInput): void {
    this.animT += dt;
    this.moving = false;
    if (this.punching) {
      this.punchT += dt;
      if (punchPhase(this.punchT) === 'done') this.punchT = -1;
      this.blocking = false;
      return;
    }
    // Blocking roots the fighter: no moving, no punching.
    this.blocking = input.block;
    if (this.blocking) return;
    if (input.punch) {
      this.punchT = 0;
      this.alreadyHit = false;
      return;
    }
    if (input.move !== 0) {
      this.x += input.move * WALK_SPEED * dt;
      this.moving = true;
    }
  }

  syncSprite(): void {
    this.sprite.setPosition(this.x, TOP);
    this.sprite.setFlipX(this.facing === -1);
    const frame = fighterFrame({
      blocking: this.blocking,
      punchT: this.punchT,
      moving: this.moving,
      animT: this.animT,
    });
    this.sprite.setFrame(`${this.prefix}-${frame}`);
  }
}
