import Phaser from 'phaser';
import { addTouchButton, isTouchDevice, type TouchButton } from '@pixel-arcade/shared';
import { BODY, SCENES, WIDTH } from '../config/game';
import { separate } from '../logic/arena';
import { resolveHit } from '../logic/combat';
import { overlaps } from '../logic/collision';
import { decideCpu, reactionTime, type CpuAction } from '../logic/cpu';
import {
  applyRound,
  newMatch,
  roundResult,
  tickTimer,
  type MatchState,
  type RoundWinner,
} from '../logic/match';
import { clampDt } from '../logic/movement';
import { mulberry32 } from '../logic/rng';
import { isThreatening } from '../logic/punch';
import { matchScore } from '../logic/score';
import { Fighter, GROUND_Y, type FighterInput } from '../entities/fighter';
import { SparkPool } from '../entities/spark';
import { Hud } from '../systems/hud';

const BANNER_SECONDS = 1.5;

interface TouchControls {
  left: TouchButton;
  right: TouchButton;
  punch: TouchButton;
  block: TouchButton;
}

export class PlayScene extends Phaser.Scene {
  private match: MatchState = newMatch();
  private p1!: Fighter;
  private p2!: Fighter;
  private sparks!: SparkPool;
  private hud!: Hud;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: Record<'A' | 'D' | 'J' | 'K', Phaser.Input.Keyboard.Key>;
  private touch: TouchControls | null = null;
  private touchPunchWasDown = false;
  private rand: () => number = mulberry32(0);
  private cpuTimer = 0;
  private cpuAction: CpuAction = 'idle';
  private bannerLeft = 0;
  private onBannerDone: (() => void) | null = null;
  private damageDealt = 0;
  private wonRoundTimeLeft: number[] = [];

  constructor() {
    super(SCENES.Play);
  }

  create(): void {
    this.match = newMatch();
    this.rand = mulberry32(Date.now());
    this.cpuTimer = 0;
    this.cpuAction = 'idle';
    this.bannerLeft = 0;
    this.onBannerDone = null;
    this.damageDealt = 0;
    this.wonRoundTimeLeft = [];
    this.touchPunchWasDown = false;

    this.add.rectangle(0, GROUND_Y, WIDTH, 30, 0x1a1c2c).setOrigin(0);
    this.add.image(0, GROUND_Y, 'atlas', 'ground').setOrigin(0).setScale(1, 2);
    this.p1 = new Fighter(this, 'p1', 80, 1);
    this.p2 = new Fighter(this, 'p2', 216, -1);
    this.sparks = new SparkPool(this);
    this.hud = new Hud(this);

    const kb = this.input.keyboard!;
    this.cursors = kb.createCursorKeys();
    this.keys = kb.addKeys('A,D,J,K') as typeof this.keys;

    this.touch = null;
    if (isTouchDevice(this)) {
      const y = 160;
      this.touch = {
        left: addTouchButton(this, { x: 22, y, label: '<', radius: 16 }),
        right: addTouchButton(this, { x: 62, y, label: '>', radius: 16 }),
        punch: addTouchButton(this, { x: 240, y, label: 'PUNCH', radius: 18 }),
        block: addTouchButton(this, { x: 288, y, label: 'BLOCK', radius: 18 }),
      };
    }

    this.startBanner(`ROUND ${this.match.round}`, null);
  }

  update(_time: number, delta: number): void {
    const dt = clampDt(delta);
    this.sparks.update(dt);

    if (this.bannerLeft > 0) {
      // Input, CPU and timer are frozen while a banner is up; discard queued key presses.
      Phaser.Input.Keyboard.JustDown(this.keys.J);
      this.touchPunchWasDown = !!this.touch?.punch.isDown;
      this.bannerLeft -= dt;
      if (this.bannerLeft <= 0) {
        this.hud.hideBanner();
        const done = this.onBannerDone;
        this.onBannerDone = null;
        done?.();
      }
      return;
    }

    this.match = tickTimer(this.match, dt);
    this.p1.update(dt, this.readPlayer());
    this.p2.update(dt, this.readCpu(dt));

    const sep = separate(this.p1.x, this.p2.x, BODY.w);
    this.p1.x = sep.a;
    this.p2.x = sep.b;
    this.p1.facing = this.p1.x <= this.p2.x ? 1 : -1;
    this.p2.facing = this.p1.facing === 1 ? -1 : 1;

    this.tryLand(this.p1, this.p2);
    this.tryLand(this.p2, this.p1);

    this.p1.syncSprite();
    this.p2.syncSprite();
    this.hud.update(this.match, this.p1.hp, this.p2.hp);

    const result = roundResult(this.p1.hp, this.p2.hp, this.match.timeLeft);
    if (result) this.endRound(result);
  }

  private readPlayer(): FighterInput {
    const left = this.cursors.left.isDown || this.keys.A.isDown || !!this.touch?.left.isDown;
    const right = this.cursors.right.isDown || this.keys.D.isDown || !!this.touch?.right.isDown;
    const touchPunch = !!this.touch?.punch.isDown;
    const punch =
      Phaser.Input.Keyboard.JustDown(this.keys.J) || (touchPunch && !this.touchPunchWasDown);
    this.touchPunchWasDown = touchPunch;
    return {
      move: (Number(right) - Number(left)) as -1 | 0 | 1,
      punch,
      block: this.keys.K.isDown || !!this.touch?.block.isDown,
    };
  }

  private readCpu(dt: number): FighterInput {
    const level = this.match.round;
    this.cpuTimer -= dt;
    let punch = false;
    if (this.cpuTimer <= 0) {
      this.cpuTimer = reactionTime(level);
      this.cpuAction = decideCpu(
        {
          distance: Math.abs(this.p1.x - this.p2.x),
          playerPunching: isThreatening(this.p1.punchT),
          canAct: !this.p2.punching,
        },
        this.rand,
        level,
      );
      punch = this.cpuAction === 'punch';
    }
    const toward = (this.p1.x < this.p2.x ? -1 : 1) as -1 | 1;
    return {
      move: this.cpuAction === 'approach' ? toward : 0,
      punch,
      block: this.cpuAction === 'block',
    };
  }

  private tryLand(attacker: Fighter, defender: Fighter): void {
    if (!attacker.canLandPunch || !overlaps(attacker.hitbox, defender.body)) return;
    attacker.alreadyHit = true;
    const { hp, dealt } = resolveHit(defender.hp, defender.blocking);
    defender.hp = hp;
    if (attacker === this.p1) this.damageDealt += dealt;
    const box = attacker.hitbox;
    this.sparks.spawn(box.x + box.w / 2, box.y + box.h / 2);
  }

  private endRound(result: RoundWinner): void {
    if (result === 'p1') this.wonRoundTimeLeft.push(this.match.timeLeft);
    const timedOut = this.p1.hp > 0 && this.p2.hp > 0;
    const ended = this.match;
    this.match = applyRound(this.match, result);
    // Show the new win pips but keep the ended round's timer until the reset.
    this.hud.update({ ...this.match, timeLeft: ended.timeLeft }, this.p1.hp, this.p2.hp);
    // applyRound is unguarded after `over`; the banner callback is the only way forward.
    this.startBanner(timedOut ? 'TIME' : 'KO', () => {
      if (this.match.over) {
        this.scene.start(SCENES.GameOver, {
          score: matchScore(this.damageDealt, this.wonRoundTimeLeft),
          won: this.match.winner === 'p1',
        });
        return;
      }
      this.p1.reset();
      this.p2.reset();
      this.cpuTimer = 0;
      this.cpuAction = 'idle';
      this.hud.update(this.match, this.p1.hp, this.p2.hp);
      this.startBanner(`ROUND ${this.match.round}`, null);
    });
  }

  private startBanner(text: string, done: (() => void) | null): void {
    this.hud.showBanner(text);
    this.bannerLeft = BANNER_SECONDS;
    this.onBannerDone = done;
  }
}
