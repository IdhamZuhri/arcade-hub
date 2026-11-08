import Phaser from 'phaser';
import { addTouchButton, isTouchDevice, type TouchButton } from '@pixel-arcade/shared';
import { GROUND_Y, SCENES, WIDTH } from '../config/game';
import { decideCpu, reactionTime, type CpuAction } from '../logic/cpu';
import { World } from '../logic/ecs';
import {
  fistRect,
  isPunching,
  landHit,
  resetFighter,
  settle,
  stepFighter,
  type FighterInput,
} from '../logic/fighter';
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
import { ageSpark, sparkFrame } from '../logic/spark';
import { drawFighter, spawnFighter, type FighterEntity } from '../entities/fighter';
import { removeSpark, spawnSpark } from '../entities/spark';
import { Hud } from '../systems/hud';
import { readDirection } from '../systems/input';
import { syncSprites } from '../systems/sprites';

const BANNER_SECONDS = 1.5;

interface TouchControls {
  left: TouchButton;
  right: TouchButton;
  punch: TouchButton;
  block: TouchButton;
}

export class PlayScene extends Phaser.Scene {
  private match: MatchState = newMatch();
  private world = new World();
  private sprites = new Map<number, Phaser.GameObjects.Sprite>();
  private p1!: FighterEntity;
  private p2!: FighterEntity;
  private sparks!: Phaser.GameObjects.Group;
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
    this.world = new World();
    this.sprites = new Map();
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
    this.p1 = spawnFighter(this, this.world, this.sprites, 'p1', 80, 1);
    this.p2 = spawnFighter(this, this.world, this.sprites, 'p2', 216, -1);
    // Pooled hit sparks: a 6-sprite group that recycles dead sparks.
    this.sparks = this.add.group({ maxSize: 6 });
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
    this.updateSparks(dt);

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
    stepFighter(this.p1.c, dt, this.readPlayer());
    stepFighter(this.p2.c, dt, this.readCpu(dt));
    settle(this.p1.c, this.p2.c);

    this.tryLand(this.p1, this.p2);
    this.tryLand(this.p2, this.p1);

    this.drawFighters();
    this.hud.update(this.match, this.p1.c.health.hp, this.p2.c.health.hp);

    const result = roundResult(this.p1.c.health.hp, this.p2.c.health.hp, this.match.timeLeft);
    if (result) this.endRound(result);
  }

  private updateSparks(dt: number): void {
    for (const s of this.world.query('spark')) {
      const age = ageSpark(s.c.spark.age, dt);
      if (age === null) {
        removeSpark(this.world, this.sprites, this.sparks, s.id);
        continue;
      }
      s.c.spark.age = age;
      this.sprites.get(s.id)?.setFrame(sparkFrame(age));
    }
  }

  private drawFighters(): void {
    syncSprites(this.world, this.sprites);
    drawFighter(this.sprites.get(this.p1.id), this.p1.c);
    drawFighter(this.sprites.get(this.p2.id), this.p2.c);
  }

  private readPlayer(): FighterInput {
    const { dx } = readDirection(
      {
        left: this.cursors.left.isDown || this.keys.A.isDown || !!this.touch?.left.isDown,
        right: this.cursors.right.isDown || this.keys.D.isDown || !!this.touch?.right.isDown,
        up: false,
        down: false,
      },
      null,
    );
    const touchPunch = !!this.touch?.punch.isDown;
    const punch =
      Phaser.Input.Keyboard.JustDown(this.keys.J) || (touchPunch && !this.touchPunchWasDown);
    this.touchPunchWasDown = touchPunch;
    return {
      move: dx,
      punch,
      block: this.keys.K.isDown || !!this.touch?.block.isDown,
    };
  }

  private readCpu(dt: number): FighterInput {
    const level = this.match.round;
    const p1 = this.p1.c;
    const p2 = this.p2.c;
    this.cpuTimer -= dt;
    let punch = false;
    if (this.cpuTimer <= 0) {
      this.cpuTimer = reactionTime(level);
      this.cpuAction = decideCpu(
        {
          distance: Math.abs(p1.position.x - p2.position.x),
          playerPunching: isThreatening(p1.punchT),
          canAct: !isPunching(p2),
        },
        this.rand,
        level,
      );
      punch = this.cpuAction === 'punch';
    }
    const toward = (p1.position.x < p2.position.x ? -1 : 1) as -1 | 1;
    return {
      move: this.cpuAction === 'approach' ? toward : 0,
      punch,
      block: this.cpuAction === 'block',
    };
  }

  private tryLand(attacker: FighterEntity, defender: FighterEntity): void {
    const dealt = landHit(attacker.c, defender.c);
    if (dealt === null) return;
    if (attacker === this.p1) this.damageDealt += dealt;
    const box = fistRect(attacker.c);
    spawnSpark(this.world, this.sprites, this.sparks, box.x + box.w / 2, box.y + box.h / 2);
  }

  private endRound(result: RoundWinner): void {
    const p1Hp = this.p1.c.health.hp;
    const p2Hp = this.p2.c.health.hp;
    if (result === 'p1') this.wonRoundTimeLeft.push(this.match.timeLeft);
    const timedOut = p1Hp > 0 && p2Hp > 0;
    const ended = this.match;
    this.match = applyRound(this.match, result);
    // Show the new win pips but keep the ended round's timer until the reset.
    this.hud.update({ ...this.match, timeLeft: ended.timeLeft }, p1Hp, p2Hp);
    // applyRound is unguarded after `over`; the banner callback is the only way forward.
    this.startBanner(timedOut ? 'TIME' : 'KO', () => {
      if (this.match.over) {
        this.scene.start(SCENES.GameOver, {
          score: matchScore(this.damageDealt, this.wonRoundTimeLeft),
          won: this.match.winner === 'p1',
        });
        return;
      }
      resetFighter(this.p1.c);
      resetFighter(this.p2.c);
      this.drawFighters();
      this.cpuTimer = 0;
      this.cpuAction = 'idle';
      this.hud.update(this.match, this.p1.c.health.hp, this.p2.c.health.hp);
      this.startBanner(`ROUND ${this.match.round}`, null);
    });
  }

  private startBanner(text: string, done: (() => void) | null): void {
    this.hud.showBanner(text);
    this.bannerLeft = BANNER_SECONDS;
    this.onBannerDone = done;
  }
}
