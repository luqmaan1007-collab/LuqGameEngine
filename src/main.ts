import './style.css';
import { Engine } from './runtime/Engine';
import { Scene } from './runtime/Scene';
import { Entity } from './runtime/Entity';
import { Transform } from './runtime/components/Transform';
import { Editor } from './ui/Editor';
import { registerLuau } from './languages/luau';

registerLuau();
const root = document.querySelector<HTMLDivElement>('#app');
if (!root) throw new Error('Missing application root');

const editor = new Editor(root);
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
