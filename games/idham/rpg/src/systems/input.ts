import type { TouchButton } from '@pixel-arcade/shared';

export type Direction = { dx: -1 | 0 | 1; dy: -1 | 0 | 1 };

export interface DirectionKeys {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
}

export type DirectionTouch = {
  left: TouchButton;
  right: TouchButton;
  up: TouchButton;
  down: TouchButton;
} | null;

/** Merge keyboard and (optional) touch d-pad state into a direction. */
export function readDirection(keys: DirectionKeys, touch: DirectionTouch): Direction {
  const left = keys.left || !!touch?.left.isDown;
  const right = keys.right || !!touch?.right.isDown;
  const up = keys.up || !!touch?.up.isDown;
  const down = keys.down || !!touch?.down.isDown;
  return {
    dx: (Number(right) - Number(left)) as -1 | 0 | 1,
    dy: (Number(down) - Number(up)) as -1 | 0 | 1,
  };
}
