import Phaser from 'phaser';

export function pixelScaleConfig(width: number, height: number): Phaser.Types.Core.GameConfig {
  return {
    width,
    height,
    pixelArt: true,
    backgroundColor: '#0d0d14',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      parent: 'game',
    },
  };
}
