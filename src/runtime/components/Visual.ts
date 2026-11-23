import type { Component } from '../Component';

export type VisualShape = 'rect' | 'circle' | 'sprite';

export class Visual implements Component {
  readonly type = 'Visual';
  constructor(public shape: VisualShape = 'rect', public color = '#60a5fa') {}
}
