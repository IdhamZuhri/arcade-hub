import Phaser from 'phaser';
import { addTouchButton, isTouchDevice } from '@pixel-arcade/shared';
import { SCENES, WIDTH, HEIGHT } from '../config/game';
import { World } from '../logic/ecs';
import { clampDt, clampToBounds, inputToVelocity, step } from '../logic/movement';
import { overlaps } from '../logic/collision';
import { mulberry32 } from '../logic/rng';
import { readDirection, type DirectionTouch } from '../systems/input';
import { syncSprites } from '../systems/sprites';

const SPEED = 90;
const ROUND_SECONDS = 30;
const PLAYER_SIZE = { x: 12, y: 12 };
const COIN_SIZE = 8;
const BOUNDS = { x: 0, y: 0, w: WIDTH, h: HEIGHT };

export class PlayScene extends Phaser.Scene {
  private world = new World();
  private sprites = new Map<number, Phaser.GameObjects.Sprite>();
  private coins!: Phaser.GameObjects.Group;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<'W' | 'A' | 'S' | 'D', Phaser.Input.Keyboard.Key>;
  private touch: DirectionTouch = null;
  private rand = mulberry32(Date.now());
  private score = 0;
  private timeLeft = ROUND_SECONDS;
  private hud!: Phaser.GameObjects.Text;

  constructor() {
    super(SCENES.Play);
  }

  create(): void {
    this.world = new World();
    this.sprites = new Map();
    this.score = 0;
    this.timeLeft = ROUND_SECONDS;

    const start = { x: WIDTH / 2, y: HEIGHT / 2 };
    const player = this.world.spawn({
      position: start,
      velocity: { x: 0, y: 0 },
      size: PLAYER_SIZE,
    });
    this.sprites.set(player.id, this.add.sprite(start.x, start.y, 'atlas', 'player').setOrigin(0));

    this.coins = this.add.group({ maxSize: 3 });
    for (let i = 0; i < 3; i++) this.spawnCoin();

    this.hud = this.add.text(4, 4, '', { fontSize: '10px', color: '#ffffff' }).setDepth(10);

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

  update(_time: number, delta: number): void {
    const dt = clampDt(delta);
    this.timeLeft -= dt;
    if (this.timeLeft <= 0) {
      this.scene.start(SCENES.GameOver, { score: this.score });
      return;
    }

    const { dx, dy } = readDirection(
      {
        left: this.cursors.left.isDown || this.wasd.A.isDown,
        right: this.cursors.right.isDown || this.wasd.D.isDown,
        up: this.cursors.up.isDown || this.wasd.W.isDown,
        down: this.cursors.down.isDown || this.wasd.S.isDown,
      },
      this.touch,
    );

    for (const e of this.world.query('position', 'velocity', 'size')) {
      e.c.velocity = inputToVelocity(dx, dy, SPEED);
      e.c.position = clampToBounds(step(e.c.position, e.c.velocity, dt), e.c.size, BOUNDS);
      this.collectCoins({ ...e.c.position, w: e.c.size.x, h: e.c.size.y });
    }
    syncSprites(this.world, this.sprites);

    this.hud.setText(`SCORE ${this.score}  TIME ${Math.ceil(this.timeLeft)}`);
  }

  private collectCoins(playerRect: { x: number; y: number; w: number; h: number }): void {
    for (const coin of this.coins.getChildren() as Phaser.GameObjects.Sprite[]) {
      if (!coin.active) continue;
      if (overlaps(playerRect, { x: coin.x, y: coin.y, w: COIN_SIZE, h: COIN_SIZE })) {
        this.score += 1;
        this.coins.killAndHide(coin);
        this.spawnCoin();
      }
    }
  }

  // Reuses a dead coin from the pooled group; maxSize caps it at 3.
  private spawnCoin(): void {
    const x = Math.floor(this.rand() * (WIDTH - COIN_SIZE));
    const y = 16 + Math.floor(this.rand() * (HEIGHT - COIN_SIZE - 16));
    const coin = this.coins.get(x, y, 'atlas', 'coin') as Phaser.GameObjects.Sprite | null;
    coin?.setOrigin(0).setPosition(x, y).setActive(true).setVisible(true);
  }
}
