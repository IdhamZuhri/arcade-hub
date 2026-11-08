import type Phaser from 'phaser';
import { ROOM_COLS, ROOM_ROWS, TILE } from '../config/game';

/** Draw the walled room from floor and wall tile images. */
export function buildRoom(scene: Phaser.Scene): void {
  for (let row = 0; row < ROOM_ROWS; row++) {
    for (let col = 0; col < ROOM_COLS; col++) {
      const edge = row === 0 || col === 0 || row === ROOM_ROWS - 1 || col === ROOM_COLS - 1;
      scene.add.image(col * TILE, row * TILE, 'atlas', edge ? 'wall' : 'floor').setOrigin(0);
    }
  }
}

export function tileToPixel(col: number, row: number): { x: number; y: number } {
  return { x: col * TILE, y: row * TILE };
}
