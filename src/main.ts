import './style.css';
import { Engine } from './runtime/Engine';
import { Scene } from './runtime/Scene';
import { Entity } from './runtime/Entity';
import { Transform } from './runtime/components/Transform';
import { Editor } from './ui/Editor';
import { Viewport3D } from './runtime/Viewport3D';
import { registerLuau } from './languages/luau';

registerLuau();
const root = document.querySelector<HTMLDivElement>('#app');
if (!root) throw new Error('Missing application root');

const editor = new Editor(root);

// WebGL is optional: devices with restricted WebGL still get the complete 2D
// editor rather than aborting startup on a failed WebGL context.
let viewport3d: Viewport3D | undefined;
try {
  viewport3d = new Viewport3D(editor.canvas3d);
  editor.attach3D(viewport3d);
  viewport3d.addPrimitive({ name: 'Starter Cube', kind: 'box', position: { x: 0, y: 0.5, z: 0 }, scale: { x: 1, y: 1, z: 1 }, color: '#60a5fa' });
} catch (error) {
  console.error('3D viewport unavailable; continuing in 2D mode.', error);
  editor.setStatus('3D unavailable on this device · 2D editor ready');
}
const scene = new Scene('Main Scene');
const player = new Entity('Player');
player.add(new Transform(110, 110, 48, 48));
scene.add(player);
const floor = new Entity('Floor');
floor.add(new Transform(0, 310, 640, 28));
scene.add(floor);

const engine = new Engine(editor.canvas);
engine.setScene(scene);
editor.attachRuntime(scene, engine);
engine.start();
editor.setStatus('Ready · select an object or press Play to run the preview');
