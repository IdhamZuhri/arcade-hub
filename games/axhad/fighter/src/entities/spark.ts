import Phaser from 'phaser';

const LIFETIME = 0.18;

/** Pooled hit sparks: a 6-sprite group that recycles dead sparks. */
export class SparkPool {
  private readonly group: Phaser.GameObjects.Group;
  private readonly age = new WeakMap<Phaser.GameObjects.GameObject, number>();

  constructor(scene: Phaser.Scene) {
    this.group = scene.add.group({ maxSize: 6 });
  }

  spawn(x: number, y: number): void {
    const s = this.group.get(x, y, 'atlas', 'spark-0') as Phaser.GameObjects.Sprite | null;
    if (!s) return;
    s.setPosition(x, y).setDepth(5).setFrame('spark-0').setActive(true).setVisible(true);
    this.age.set(s, 0);
  }

  update(dt: number): void {
    for (const s of this.group.getChildren() as Phaser.GameObjects.Sprite[]) {
      if (!s.active) continue;
      const t = (this.age.get(s) ?? 0) + dt;
      if (t >= LIFETIME) {
        this.group.killAndHide(s);
        continue;
      }
      this.age.set(s, t);
      s.setFrame(`spark-${Math.min(2, Math.floor((t / LIFETIME) * 3))}`);
    }
  }
}
