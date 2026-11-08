import { WIDTH } from '../config/game';

/** Keep two fighters of width `w` on screen and out of each other, splitting any overlap evenly. */
export function separate(ax: number, bx: number, w: number): { a: number; b: number } {
  let a = Math.min(Math.max(ax, 0), WIDTH - w);
  let b = Math.min(Math.max(bx, 0), WIDTH - w);
  const overlap = w - Math.abs(a - b);
  if (overlap > 0) {
    const push = overlap / 2;
    const dir = a <= b ? 1 : -1;
    a -= dir * push;
    b += dir * push;
    // A wall may have eaten part of the push; re-clamp and shove the partner out.
    if (a < 0 || a > WIDTH - w) {
      a = Math.min(Math.max(a, 0), WIDTH - w);
      b = a + dir * w;
    } else if (b < 0 || b > WIDTH - w) {
      b = Math.min(Math.max(b, 0), WIDTH - w);
      a = b - dir * w;
    }
  }
  return { a, b };
}
