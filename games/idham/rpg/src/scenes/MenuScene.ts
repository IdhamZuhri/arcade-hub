import Phaser from 'phaser';
import { loadHighScore } from '@pixel-arcade/shared';
import { GAME_ID, TITLE, SCENES, WIDTH, HEIGHT } from '../config/game';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super(SCENES.Menu);
  }

  create(): void {
    const style = { fontSize: '10px', color: '#ffffff' };
    this.add.text(WIDTH / 2, 50, TITLE, { ...style, fontSize: '20px' }).setOrigin(0.5);
    this.add.text(WIDTH / 2, 85, `BEST ${loadHighScore(GAME_ID)}`, style).setOrigin(0.5);
    this.add
      .text(
        WIDTH / 2,
        HEIGHT - 50,
        'SPACE / ENTER / TAP to start\nArrows/WASD to move · collect coins · avoid slimes',
        {
          ...style,
          align: 'center',
        },
      )
      .setOrigin(0.5);

    const start = () => this.scene.start(SCENES.Play);
    this.input.keyboard?.once('keydown-SPACE', start);
    this.input.keyboard?.once('keydown-ENTER', start);
    this.input.once('pointerdown', start);
  }
}
