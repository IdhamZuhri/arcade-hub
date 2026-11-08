import Phaser from 'phaser';
import { addTouchButton, isTouchDevice } from '@pixel-arcade/shared';
import { MAX_COINS, MAX_SLIMES, SCENES, HEIGHT, START_HEARTS, TILE } from '../config/game';
import { coinFrame, nextHeroAnim, slimeFrame } from '../logic/anim';
import { overlaps } from '../logic/collision';
import { slimeMode, slimeSpeed, spawnInterval } from '../logic/difficulty';
import { World } from '../logic/ecs';
import { clampDt } from '../logic/movement';
import { mulberry32 } from '../logic/rng';
import {
  center,
  heroDead,
  heroTile,
  hitHero,
  hitRect,
  moveHero,
  moveSlime,
  occupiedTile,
  tickInvuln,
} from '../logic/rules';
import { scoreForCoins } from '../logic/score';
import { pickCoinTile, type Tile } from '../logic/spawn';
import { removeCoin, spawnCoin } from '../entities/coin';
import { drawHero, spawnHero, type HeroEntity } from '../entities/hero';
import { spawnSlime } from '../entities/slime';
import { readDirection, type DirectionTouch } from '../systems/input';
import { buildRoom, tileToPixel } from '../systems/room';
import { syncSprites } from '../systems/sprites';

export class PlayScene extends Phaser.Scene {
  private world = new World();
  private sprites = new Map<number, Phaser.GameObjects.Sprite>();
  private hero!: HeroEntity;
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
    this.world = new World();
    this.sprites = new Map();
    this.rand = mulberry32(Date.now());
    this.t = 0;
    this.collected = 0;
    this.spawnTimer = spawnInterval(0);

    this.cameras.main.setBackgroundColor('#1a1c2c');
    buildRoom(this);
    this.hero = spawnHero(this, this.world, this.sprites, 10 * TILE - 8, 5 * TILE);
    this.coins = this.add.group({ maxSize: MAX_COINS });
    this.slimes = this.add.group({ maxSize: MAX_SLIMES });
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
    const hero = this.hero.c;
    tickInvuln(hero, dt);
    moveHero(hero, dx, dy, dt);
    hero.anim = nextHeroAnim(hero.anim, dx, dy, dt);
    drawHero(this.sprites.get(this.hero.id), hero);

    this.updateSlimes(dt, time);
    this.updateCoins(time);
    syncSprites(this.world, this.sprites);

    this.hearts.forEach((h, i) => h.setVisible(i < hero.health.hp));
    this.scoreText.setText(`SCORE ${scoreForCoins(this.collected)}`);

    if (heroDead(hero)) {
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
    const hero = this.hero.c;
    const target = center(hero);
    const hit = hitRect(hero);
    for (const s of this.world.query('slime', 'position', 'velocity', 'size', 'hitbox')) {
      moveSlime(s.c, dt, speed, mode, target, this.rand);
      this.sprites.get(s.id)?.setFrame(slimeFrame(time));
      if (overlaps(hit, hitRect(s.c))) hitHero(hero);
    }
  }

  private updateCoins(time: number): void {
    const hit = hitRect(this.hero.c);
    for (const coin of this.world.query('coin', 'position', 'hitbox')) {
      this.sprites.get(coin.id)?.setFrame(coinFrame(time));
      if (overlaps(hit, hitRect(coin.c))) {
        removeCoin(this.world, this.sprites, this.coins, coin.id);
        this.collected += 1;
      }
    }
    this.topUpCoins();
  }

  private occupiedTiles(): Tile[] {
    return [...this.world.query('coin', 'position'), ...this.world.query('slime', 'position')].map(
      (e) => occupiedTile(e.c.position),
    );
  }

  private topUpCoins(): void {
    while (this.world.query('coin').length < MAX_COINS) {
      const tile = pickCoinTile(this.rand, heroTile(this.hero.c), this.occupiedTiles());
      if (!tile) return;
      const p = tileToPixel(tile.col, tile.row);
      if (!spawnCoin(this.world, this.sprites, this.coins, p.x + 4, p.y + 4)) return;
    }
  }

  private spawnSlime(): void {
    const tile = pickCoinTile(this.rand, heroTile(this.hero.c), this.occupiedTiles());
    if (!tile) return;
    const p = tileToPixel(tile.col, tile.row);
    spawnSlime(this.world, this.sprites, this.slimes, p.x, p.y);
  }
}
