import Phaser from 'phaser';

export interface TouchButton {
  readonly isDown: boolean;
  destroy(): void;
}

export function isTouchDevice(scene: Phaser.Scene): boolean {
  return scene.sys.game.device.input.touch;
}

export function addTouchButton(
  scene: Phaser.Scene,
  opts: { x: number; y: number; label: string; radius?: number },
): TouchButton {
  const radius = opts.radius ?? 20;
  // Allow three simultaneous pointers (default is two).
  scene.input.addPointer(2);

  const circle = scene.add
    .circle(opts.x, opts.y, radius, 0xffffff, 0.25)
    .setScrollFactor(0)
    .setDepth(1000)
    .setInteractive();
  const text = scene.add
    .text(opts.x, opts.y, opts.label, { fontSize: '10px', color: '#ffffff' })
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(1000);

  const down = new Set<number>();
  const press = (p: Phaser.Input.Pointer) => down.add(p.id);
  const release = (p: Phaser.Input.Pointer) => down.delete(p.id);
  circle.on('pointerdown', press);
  circle.on('pointerup', release);
  circle.on('pointerout', release);

  return {
    get isDown() {
      return down.size > 0;
    },
    destroy() {
      down.clear();
      circle.destroy();
      text.destroy();
    },
  };
}
