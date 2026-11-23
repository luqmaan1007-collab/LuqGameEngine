import type { Component } from '../Component';

export class Transform implements Component {
  readonly type = 'Transform';
  constructor(public x = 0, public y = 0, public width = 32, public height = 32) {}
}
