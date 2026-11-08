import Phaser from 'phaser';
import { addTouchButton, isTouchDevice } from '@pixel-arcade/shared';
import { MAX_COINS, MAX_SLIMES, SCENES, HEIGHT, START_HEARTS, TILE } from '../config/game';
import { overlaps } from '../logic/collision';
import { slimeMode, slimeSpeed, spawnInterval } from '../logic/difficulty';
import { isDead, takeHit, tickHealth } from '../logic/health';
import { clampDt } from '../logic/movement';
import { mulberry32 } from '../logic/rng';
import { scoreForCoins } from '../logic/score';
import { pickCoinTile, type Tile } from '../logic/spawn';
import { Coin } from '../entities/coin';
import { Hero } from '../entities/hero';
import { Slime } from '../entities/slime';
import { readDirection, type DirectionTouch } from '../systems/input';
import { buildRoom, tileToPixel } from '../systems/room';

export class PlayScene extends Phaser.Scene {
  private hero!: Hero;
  private coins!: Phaser.GameObjects.Group;
  private slimes!: Phaser.GameObjects.Group;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<'W' | 'A' | 'S' | 'D', Phaser.Input.Keyboard.Key>;
  private touch: DirectionTouch = null;
  private rand: () => number = mulberry32(0);
  private t = 0;
  private spawnTimer = 0;
  private collected = 0;
  private hearts: Phaser.GameObjects.Image[] = [];
  private scoreText!: Phaser.GameObjects.Text;

  constructor() {
    super(SCENES.Play);
  }

  create(): void {
    this.rand = mulberry32(Date.now());
    this.t = 0;
    this.collected = 0;
    this.spawnTimer = spawnInterval(0);

    this.cameras.main.setBackgroundColor('#1a1c2c');
    buildRoom(this);
    this.hero = new Hero(this, 10 * TILE - 8, 5 * TILE);
    this.coins = this.add.group({ classType: Coin, maxSize: MAX_COINS });
    this.slimes = this.add.group({ classType: Slime, maxSize: MAX_SLIMES });
    this.topUpCoins();

    this.hearts = [];
    for (let i = 0; i < START_HEARTS; i++) {
      this.hearts.push(
        this.add
          .image(4 + i * 10, 4, 'atlas', 'heart')
          .setOrigin(0)
          .setDepth(10),
      );
    }
    this.scoreText = this.add
      .text(316, 2, '', { fontSize: '10px', color: '#ffffff' })
      .setOrigin(1, 0)
      .setDepth(10);

    const kb = this.input.keyboard!;
    this.cursors = kb.createCursorKeys();
    this.wasd = kb.addKeys('W,A,S,D') as typeof this.wasd;

    this.touch = null;
    if (isTouchDevice(this)) {
      const y = HEIGHT - 30;
      this.touch = {
        left: addTouchButton(this, { x: 24, y, label: '<', radius: 14 }),
        right: addTouchButton(this, { x: 72, y, label: '>', radius: 14 }),
        up: addTouchButton(this, { x: 48, y: y - 26, label: '^', radius: 14 }),
        down: addTouchButton(this, { x: 48, y: y + 4, label: 'v', radius: 14 }),
      };
    }
  }

  update(time: number, delta: number): void {
    const dt = clampDt(delta);
    this.t += dt;

    const { dx, dy } = readDirection(
      {
        left: this.cursors.left.isDown || this.wasd.A.isDown,
        right: this.cursors.right.isDown || this.wasd.D.isDown,
        up: this.cursors.up.isDown || this.wasd.W.isDown,
        down: this.cursors.down.isDown || this.wasd.S.isDown,
      },
      this.touch,
    );
    this.hero.health = tickHealth(this.hero.health, dt);
    this.hero.move(dx, dy, dt);

    this.updateSlimes(dt, time);
    this.updateCoins(time);

    this.hearts.forEach((h, i) => h.setVisible(i < this.hero.health.hearts));
    this.scoreText.setText(`SCORE ${scoreForCoins(this.collected)}`);

    if (isDead(this.hero.health)) {
      this.scene.start(SCENES.GameOver, { score: scoreForCoins(this.collected) });
    }
  }

  private updateSlimes(dt: number, time: number): void {
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnTimer = spawnInterval(this.t);
      this.spawnSlime();
    }
    const speed = slimeSpeed(this.t);
    const mode = slimeMode(this.t);
    const target = this.hero.center();
    const hit = this.hero.hitRect();
    for (const s of this.slimes.getChildren() as Slime[]) {
      if (!s.active) continue;
      s.tick(dt, time, speed, mode, target, this.rand);
      if (overlaps(hit, s.hitRect())) this.hero.health = takeHit(this.hero.health);
    }
  }

  private updateCoins(time: number): void {
    const hit = this.hero.hitRect();
    for (const c of this.coins.getChildren() as Coin[]) {
      if (!c.active) continue;
      c.spin(time);
      if (overlaps(hit, c.rect())) {
        this.coins.killAndHide(c);
        this.collected += 1;
      }
    }
    this.topUpCoins();
  }

  private occupiedTiles(): Tile[] {
    const out: Tile[] = [];
    for (const g of [this.coins, this.slimes]) {
      for (const o of g.getChildren() as Phaser.GameObjects.Sprite[]) {
        if (o.active)
          out.push({ col: Math.floor((o.x + 4) / TILE), row: Math.floor((o.y + 4) / TILE) });
      }
    }
    return out;
  }

  private topUpCoins(): void {
    while (this.coins.countActive(true) < MAX_COINS) {
      const tile = pickCoinTile(this.rand, this.hero.tile(), this.occupiedTiles());
      const coin = tile ? (this.coins.get() as Coin | null) : null;
      if (!tile || !coin) return;
      const p = tileToPixel(tile.col, tile.row);
      coin.place(p.x + 4, p.y + 4);
    }
  }

  private spawnSlime(): void {
    const tile = pickCoinTile(this.rand, this.hero.tile(), this.occupiedTiles());
    const slime = tile ? (this.slimes.get() as Slime | null) : null;
    if (!tile || !slime) return;
    const p = tileToPixel(tile.col, tile.row);
    slime.place(p.x, p.y);
  }
}
