import Phaser from 'phaser';
import { recordScore } from '@pixel-arcade/shared';
import { GAME_ID, SCENES, WIDTH, HEIGHT } from '../config/game';

export class GameOverScene extends Phaser.Scene {
  private score = 0;
  private won = false;

  constructor() {
    super(SCENES.GameOver);
  }

  init(data: { score: number; won: boolean }): void {
    this.score = data?.score ?? 0;
    this.won = data?.won ?? false;
  }

  create(): void {
    const { best, isNew } = recordScore(GAME_ID, this.score);
    const style = { fontSize: '10px', color: '#ffffff' };
    this.add
      .text(WIDTH / 2, 40, this.won ? 'YOU WIN' : 'YOU LOSE', { ...style, fontSize: '20px' })
      .setOrigin(0.5);
    this.add.text(WIDTH / 2, 80, `SCORE ${this.score}`, style).setOrigin(0.5);
    this.add.text(WIDTH / 2, 95, `BEST ${best}`, style).setOrigin(0.5);
    if (isNew) {
      this.add.text(WIDTH / 2, 112, 'NEW BEST!', { ...style, color: '#ffcd75' }).setOrigin(0.5);
    }
    this.add
      .text(WIDTH / 2, HEIGHT - 30, 'SPACE / TAP: play again   M: menu', style)
      .setOrigin(0.5);

    const again = () => this.scene.start(SCENES.Play);
    this.input.keyboard?.once('keydown-SPACE', again);
    this.input.keyboard?.once('keydown-M', () => this.scene.start(SCENES.Menu));
    this.input.once('pointerdown', again);
  }
}
