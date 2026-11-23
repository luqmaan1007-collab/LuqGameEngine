import type { Scene } from './Scene';
import { Transform } from './components/Transform';

export class Engine {
  private scene?: Scene;
  private running = false;
  private lastTime = 0;
  private raf = 0;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly keys = new Set<string>();
  private pointer = { x: 0, y: 0, down: false };

  constructor(private readonly canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D is unavailable');
    this.ctx = ctx;
    window.addEventListener('keydown', e => this.keys.add(e.key.toLowerCase()));
    window.addEventListener('keyup', e => this.keys.delete(e.key.toLowerCase()));
    canvas.addEventListener('pointerdown', e => { this.pointer.down = true; this.updatePointer(e); });
    canvas.addEventListener('pointermove', e => this.updatePointer(e));
    window.addEventListener('pointerup', () => { this.pointer.down = false; });
  }

  setScene(scene: Scene): void { this.scene = scene; }
  getInput() { return { keys: this.keys, pointer: this.pointer }; }
  start(): void {
    if (this.running) return;
    this.running = true;
    this.raf = requestAnimationFrame(this.tick);
  }
  stop(): void { this.running = false; cancelAnimationFrame(this.raf); }

  private updatePointer(event: PointerEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    this.pointer.x = (event.clientX - rect.left) * this.canvas.width / rect.width;
    this.pointer.y = (event.clientY - rect.top) * this.canvas.height / rect.height;
  }

  private tick = (time: number): void => {
    if (!this.running) return;
    const dt = this.lastTime ? Math.min((time - this.lastTime) / 1000, 0.05) : 0;
    this.lastTime = time;
    for (const entity of this.scene?.entities ?? []) {
      if (!entity.active) continue;
      for (const component of entity.components.values()) component.update?.(dt);
    }
    this.render();
    this.raf = requestAnimationFrame(this.tick);
  };

  private render(): void {
    const { ctx, canvas } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#101827';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#24344b';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 32) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 32) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }
    for (const entity of this.scene?.entities ?? []) {
      if (!entity.active) continue;
      const t = entity.get<Transform>('Transform');
      if (!t) continue;
      ctx.fillStyle = entity.name === 'Floor' ? '#64748b' : '#60a5fa';
      ctx.fillRect(t.x, t.y, t.width, t.height);
      ctx.strokeStyle = '#dbeafe';
      ctx.strokeRect(t.x, t.y, t.width, t.height);
    }
  }
}
