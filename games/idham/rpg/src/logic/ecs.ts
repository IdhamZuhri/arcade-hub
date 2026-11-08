import type { HeroAnim } from './anim';
import type { Rect, Vec2 } from './movement';

export interface Components {
  position?: Vec2;
  velocity?: Vec2;
  size?: Vec2;
  health?: { hp: number; max: number };
  /** Hit area: an offset from `position` plus a width and height. */
  hitbox?: Rect;
  /** Hero: seconds of invulnerability left after a hit. */
  invuln?: number;
  /** Hero: walk-cycle animation state. */
  anim?: HeroAnim;
  /** Slime tag; `repick` is seconds until it picks a new wander heading. */
  slime?: { repick: number };
  /** Coin tag. */
  coin?: true;
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
