import Phaser from 'phaser';
import { SCENES, WIDTH, HEIGHT } from '../config/game';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super(SCENES.Preload);
  }

  preload(): void {
    const bar = this.add.rectangle(WIDTH / 2 - 50, HEIGHT / 2, 0, 8, 0xffffff).setOrigin(0, 0.5);
    this.add.rectangle(WIDTH / 2, HEIGHT / 2, 100, 8).setStrokeStyle(1, 0xffffff);
    this.load.on('progress', (p: number) => {
      bar.width = 100 * p;
    });
    this.load.setPath(import.meta.env.BASE_URL + 'assets/');
    this.load.atlas('atlas', 'atlas.png', 'atlas.json');
  }

  create(): void {
    this.scene.start(SCENES.Menu);
  }
}
