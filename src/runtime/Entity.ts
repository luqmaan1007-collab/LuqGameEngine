import type { Component } from './Component';

export class Entity {
  readonly id = crypto.randomUUID();
  readonly components = new Map<string, Component>();
  active = true;
  constructor(public name: string) {}
  add<T extends Component>(component: T): T {
    this.components.set(component.type, component);
    return component;
  }
  get<T extends Component>(type: string): T | undefined {
    return this.components.get(type) as T | undefined;
  }
}
