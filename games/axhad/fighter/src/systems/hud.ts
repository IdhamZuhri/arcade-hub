import Phaser from 'phaser';
import { MAX_HP, WIDTH, WINS_NEEDED } from '../config/game';
import type { MatchState } from '../logic/match';

const BAR_W = 120;
const BAR_H = 8;
const MARGIN = 8;
const style = { fontSize: '10px', color: '#ffffff' };

export class Hud {
  private readonly gfx: Phaser.GameObjects.Graphics;
  private readonly timer: Phaser.GameObjects.Text;
  private readonly banner: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    this.gfx = scene.add.graphics().setDepth(10);
    this.timer = scene.add
      .text(WIDTH / 2, 12, '', { ...style, fontSize: '14px' })
      .setOrigin(0.5)
      .setDepth(10);
    this.banner = scene.add
      .text(WIDTH / 2, 70, '', { ...style, fontSize: '20px' })
      .setOrigin(0.5)
      .setDepth(20);
  }

  showBanner(text: string): void {
    this.banner.setText(text).setVisible(true);
  }

  hideBanner(): void {
    this.banner.setVisible(false);
  }

  update(m: MatchState, p1Hp: number, p2Hp: number): void {
    const g = this.gfx;
    g.clear();
    const right = WIDTH - MARGIN - BAR_W;
    g.fillStyle(0x333c57).fillRect(MARGIN, MARGIN, BAR_W, BAR_H);
    g.fillStyle(0x333c57).fillRect(right, MARGIN, BAR_W, BAR_H);
    // P1's bar drains toward the left edge, P2's toward the right edge.
    const w1 = Math.round((Math.max(p1Hp, 0) / MAX_HP) * BAR_W);
    const w2 = Math.round((Math.max(p2Hp, 0) / MAX_HP) * BAR_W);
    g.fillStyle(0x41a6f6).fillRect(MARGIN, MARGIN, w1, BAR_H);
    g.fillStyle(0xef7d57).fillRect(WIDTH - MARGIN - w2, MARGIN, w2, BAR_H);
    g.lineStyle(1, 0xf4f4f4).strokeRect(MARGIN, MARGIN, BAR_W, BAR_H);
    g.strokeRect(right, MARGIN, BAR_W, BAR_H);
    for (let i = 0; i < WINS_NEEDED; i++) {
      g.fillStyle(i < m.p1Wins ? 0xffcd75 : 0x333c57).fillRect(MARGIN + i * 10, 20, 6, 6);
      g.fillStyle(i < m.p2Wins ? 0xffcd75 : 0x333c57).fillRect(
        WIDTH - MARGIN - 6 - i * 10,
        20,
        6,
        6,
      );
    }
    this.timer.setText(String(Math.ceil(m.timeLeft)));
  }
}
