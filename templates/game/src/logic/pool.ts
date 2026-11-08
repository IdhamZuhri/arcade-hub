export class Pool<T> {
  private free: T[] = [];
  private active = new Set<T>();

  constructor(
    private create: () => T,
    private reset: (t: T) => void,
    private max: number,
  ) {}

  acquire(): T | null {
    let item = this.free.pop();
    if (item === undefined) {
      if (this.active.size >= this.max) return null;
      item = this.create();
    }
    this.active.add(item);
    return item;
  }

  release(t: T): void {
    if (!this.active.delete(t)) return;
    this.reset(t);
    this.free.push(t);
  }

  get activeCount(): number {
    return this.active.size;
  }
}
