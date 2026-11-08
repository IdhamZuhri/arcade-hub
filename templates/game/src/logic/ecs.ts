import type { Vec2 } from './movement';

export interface Components {
  position?: Vec2;
  velocity?: Vec2;
  size?: Vec2;
  health?: { hp: number; max: number };
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
