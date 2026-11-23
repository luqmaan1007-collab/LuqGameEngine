import type { Entity } from './Entity';

export class Scene {
  readonly entities: Entity[] = [];
  constructor(public name: string) {}
  add(entity: Entity): void { this.entities.push(entity); }
  remove(id: string): void {
    const i = this.entities.findIndex(entity => entity.id === id);
    if (i >= 0) this.entities.splice(i, 1);
  }
}
