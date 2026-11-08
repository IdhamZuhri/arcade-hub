import Phaser from 'phaser';
import type { Rect } from '../logic/movement';

const SPIN = [0, 1, 2, 1] as const;

export class Coin extends Phaser.GameObjects.Sprite {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'atlas', 'coin-0');
    this.setOrigin(0).setDepth(3);
  }

  place(x: number, y: number): void {
    this.setPosition(x, y).setActive(true).setVisible(true);
  }

  spin(time: number): void {
    this.setFrame(`coin-${SPIN[Math.floor(time / 150) % SPIN.length]}`);
  }

  rect(): Rect {
    return { x: this.x, y: this.y, w: 8, h: 8 };
  }
}
