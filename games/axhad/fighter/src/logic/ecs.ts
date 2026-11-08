import type { Vec2 } from './movement';

export interface Components {
  position?: Vec2;
  velocity?: Vec2;
  size?: Vec2;
  health?: { hp: number; max: number };
  /** Fighter: 1 faces right, -1 faces left. */
  facing?: 1 | -1;
  /** Fighter: seconds since the current punch began; -1 when not punching. */
  punchT?: number;
  /** Fighter: the current punch has already landed. */
  alreadyHit?: boolean;
  blocking?: boolean;
  /** Fighter: walk/idle animation state. */
  anim?: { moving: boolean; t: number };
  /** Fighter: where a new round puts it. */
  start?: { x: number; facing: 1 | -1 };
  /** Fighter: which palette's frames to draw. */
  skin?: 'p1' | 'p2';
  /** Hit spark tag; `age` is seconds since it appeared. */
  spark?: { age: number };
}

export type Entity = { id: number; c: Components };

export class World {
  private nextId = 1;
  private entities = new Map<number, Entity>();

  spawn(c: Components): Entity {
    const e: Entity = { id: this.nextId++, c };
    this.entities.set(e.id, e);
    return e;
  }

  remove(id: number): void {
    this.entities.delete(id);
  }

  query<K extends keyof Components>(
    ...keys: K[]
  ): (Entity & { c: Required<Pick<Components, K>> })[] {
    const out: (Entity & { c: Required<Pick<Components, K>> })[] = [];
    for (const e of this.entities.values()) {
      if (keys.every((k) => e.c[k] !== undefined)) {
        out.push(e as Entity & { c: Required<Pick<Components, K>> });
      }
    }
    return out;
  }
}
