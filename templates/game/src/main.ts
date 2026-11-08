import Phaser from 'phaser';
import { pixelScaleConfig } from '@pixel-arcade/shared';
import { WIDTH, HEIGHT } from './config/game';
import { PreloadScene } from './scenes/PreloadScene';
import { MenuScene } from './scenes/MenuScene';
import { PlayScene } from './scenes/PlayScene';
import { GameOverScene } from './scenes/GameOverScene';

new Phaser.Game({
  type: Phaser.AUTO,
  ...pixelScaleConfig(WIDTH, HEIGHT),
  scene: [PreloadScene, MenuScene, PlayScene, GameOverScene],
});
