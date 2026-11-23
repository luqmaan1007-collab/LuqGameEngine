export interface Component {
  readonly type: string;
  update?(deltaSeconds: number): void;
}
