import * as monaco from 'monaco-editor';
import { languages } from '../languages/registry';
import { PluginManager } from '../plugins/PluginManager';
import { Scene } from '../runtime/Scene';
import { Entity } from '../runtime/Entity';
import { Transform } from '../runtime/components/Transform';
import { Visual, type VisualShape } from '../runtime/components/Visual';
import { Engine } from '../runtime/Engine';
import { Viewport3D, type Scene3DNode } from '../runtime/Viewport3D';

type SavedEntity = { id?: string; name: string; active: boolean; transform?: {x:number;y:number;width:number;height:number}; visual?: { shape: VisualShape; color: string } };
type SavedProject = { format: 'LuqGameProject/1'; scene: string; entities: SavedEntity[]; nodes3d?: Scene3DNode[] };

const starterCode = 'local Players = game:GetService("Players")\n\nlocal function onPlayerAdded(player: Player)\n    print("Welcome, " .. player.Name)\nend\n\nPlayers.PlayerAdded:Connect(onPlayerAdded)\n';

export class Editor {
  readonly canvas: HTMLCanvasElement;
  readonly canvas3d: HTMLCanvasElement;
  private threeD?: Viewport3D;
  private viewportMode: '2d' | '3d' = '2d';
  private status!: HTMLElement;
  private editor?: monaco.editor.IStandaloneCodeEditor;
  private readonly plugins = new PluginManager();
  private scene?: Scene;
  private engine?: Engine;
  private selected?: Entity;
  private playing = false;

  constructor(private readonly root: HTMLElement) {
    root.innerHTML = [
      '<div class="app-shell">',
      '<header class="topbar"><div class="brand"><div class="brand-mark">L</div><div><strong>LuqGameEngine</strong><small>GAME STUDIO <span>EARLY ACCESS</span></small></div></div>',
      '<div class="top-actions"><button class="icon-btn" id="mode-2d">2D</button><button class="icon-btn" id="mode-3d">3D</button><button class="icon-btn" id="add-3d">＋ 3D</button><button class="icon-btn" id="save" title="Save project">Save</button><button class="icon-btn" id="import-project">Open</button><button class="primary-btn" id="play">▶ Play</button><button class="icon-btn" id="export">Export</button><button class="icon-btn" id="plugin-upload">＋ Plugin</button><input id="plugin-file" type="file" accept=".elg,application/json" hidden><input id="project-file" type="file" accept=".json,.luq" hidden></div></header>',
      '<div class="workspace">',
      '<aside class="left-panel"><div class="panel-heading"><span>PROJECT</span><button id="new-object" class="mini-btn" title="Add object">＋</button></div><div class="project-name">My Game <span>LOCAL</span></div><div class="tree" id="hierarchy"></div>',
      '<div class="panel-heading languages-heading"><span>LANGUAGES</span></div><div class="language-list">' + languages.map(l => '<span>' + l.label + '</span>').join('') + '</div></aside>',
      '<main class="center-panel"><div class="document-tabs"><span class="doc-tab active">◈ Main Scene</span><span class="doc-tab">⌘ main.server.luau</span><span class="spacer"></span><span class="viewport-label">2D VIEWPORT</span></div>',
      '<section class="preview-wrap"><div class="viewport-toolbar"><span>SCENE VIEW</span><span>640 × 360</span><button id="reset-view">Reset view</button></div><div class="preview"><canvas width="640" height="360" aria-label="Game scene preview"></canvas></div></section>',
      '<section class="code-panel"><div class="code-toolbar"><div><span class="panel-heading-text">SCRIPT EDITOR</span><span class="file-path">/ Scripts / main.server.luau</span></div><select id="language" aria-label="Programming language"></select></div><div id="code"></div></section></main>',
      '<aside class="right-panel"><div class="panel-heading"><span>INSPECTOR</span><span class="inspector-tag">OBJECT</span></div><div id="inspector-content" class="inspector-content"><div class="empty-inspector">Select an object in the hierarchy to edit its properties.</div></div>',
      '<div class="panel-heading export-heading"><span>BUILD TARGETS</span></div><div class="build-list"><div><b>◉</b><span>Android APK</span><small>Capacitor</small></div><div><b>◈</b><span>Roblox place</span><small>.rbxl</small></div><div><b>▣</b><span>Windows app</span><small>.exe</small></div><div><b>▣</b><span>macOS app</span><small>.dmg</small></div></div><div class="build-note">Builds run in GitHub Actions. Open the repository Actions tab to download generated artifacts.</div></aside>',
      '</div><footer><span><i class="status-dot"></i> <span id="runtime-state">Runtime ready</span></span><span id="status">Welcome to LuqGameEngine</span><span>Touch · Mouse · Keyboard</span></footer></div>'
    ].join('');

    const canvas = root.querySelector<HTMLCanvasElement>('#viewport-2d');
    const canvas3d = root.querySelector<HTMLCanvasElement>('#viewport-3d');
    const status = root.querySelector<HTMLElement>('#status');
    const code = root.querySelector<HTMLElement>('#code');
    const languageSelect = root.querySelector<HTMLSelectElement>('#language');
    const pluginInput = root.querySelector<HTMLInputElement>('#plugin-file');
    if (!canvas || !canvas3d || !status || !code || !languageSelect || !pluginInput) throw new Error('Editor view failed');
    this.canvas = canvas;
    this.canvas3d = canvas3d;
    this.status = status;

    for (const language of languages) {
      const option = document.createElement('option');
      option.value = language.id;
      option.textContent = language.label + (language.runtime === 'external' ? ' · toolchain' : '');
      languageSelect.append(option);
      if (language.id !== 'luau' && !monaco.languages.getLanguages().some(item => item.id === language.monacoId)) {
        monaco.languages.register({ id: language.monacoId });
      }
    }
    this.editor = monaco.editor.create(code, {
      value: starterCode, language: 'luau', theme: 'vs-dark', automaticLayout: true,
      minimap: { enabled: false }, fontSize: 13, scrollBeyondLastLine: false,
      wordWrap: 'on', padding: { top: 12 }, lineNumbersMinChars: 3
    });
    languageSelect.value = 'luau';
    languageSelect.addEventListener('change', () => {
      const selected = languages.find(item => item.id === languageSelect.value);
      if (!selected || !this.editor?.getModel()) return;
      const supported = monaco.languages.getLanguages().some(item => item.id === selected.monacoId);
      monaco.editor.setModelLanguage(this.editor.getModel()!, supported ? selected.monacoId : 'plaintext');
      this.setStatus(supported ? 'Editing ' + selected.label : selected.label + ': text editing enabled; compiler adapter not installed');
    });

    root.querySelector('#plugin-upload')?.addEventListener('click', () => pluginInput.click());
    pluginInput.addEventListener('change', async () => {
      const file = pluginInput.files?.[0];
      if (!file) return;
      try {
        const plugin = await this.plugins.inspect(file);
        this.setStatus('Validated ' + plugin.name + ' v' + plugin.version + ' · permissions: ' + (plugin.permissions.join(', ') || 'none'));
      } catch (error) {
        this.setStatus(error instanceof Error ? error.message : 'ELG validation failed');
      } finally { pluginInput.value = ''; }
    });
    root.querySelector('#save')?.addEventListener('click', () => this.saveProject());
    root.querySelector('#export')?.addEventListener('click', () => this.exportProject());
    root.querySelector('#import-project')?.addEventListener('click', () => root.querySelector<HTMLInputElement>('#project-file')?.click());
    root.querySelector<HTMLInputElement>('#project-file')?.addEventListener('change', event => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file) void this.importProject(file);
      (event.target as HTMLInputElement).value = '';
    });
    root.querySelector('#new-object')?.addEventListener('click', () => this.addObject());
    root.querySelector('#play')?.addEventListener('click', () => this.togglePlay());
    root.querySelector('#reset-view')?.addEventListener('click', () => this.setStatus('Viewport centered · 640 × 360'));
    root.querySelector('#mode-2d')?.addEventListener('click', () => this.setMode('2d'));
    root.querySelector('#mode-3d')?.addEventListener('click', () => this.setMode('3d'));
    root.querySelector('#add-3d')?.addEventListener('click', () => this.add3DPrimitive());
    window.addEventListener('keydown', event => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') { event.preventDefault(); this.saveProject(); }
      if (event.key === 'F5') { event.preventDefault(); this.togglePlay(); }
    });
  }

  attach3D(viewport: Viewport3D): void { this.threeD = viewport; }

  private setMode(mode: '2d' | '3d'): void {
    this.viewportMode = mode;
    this.canvas.hidden = mode !== '2d';
    this.canvas3d.hidden = mode !== '3d';
    const title = this.root.querySelector<HTMLElement>('#viewport-title');
    if (title) title.textContent = mode.toUpperCase() + ' SCENE VIEW';
    this.root.querySelector('#mode-2d')?.classList.toggle('active-mode', mode === '2d');
    this.root.querySelector('#mode-3d')?.classList.toggle('active-mode', mode === '3d');
    this.setStatus(mode === '3d' ? '3D viewport · drag to orbit, scroll to zoom' : '2D viewport');
    window.dispatchEvent(new Event('resize'));
  }

  private add3DPrimitive(): void {
    if (!this.threeD) return;
    this.threeD.addPrimitive({ name: '3D Box', kind: 'box', position: { x: 0, y: 0.5, z: 0 }, scale: { x: 1, y: 1, z: 1 }, color: '#60a5fa' });
    this.setMode('3d');
    this.setStatus('Added a 3D box');
  }

  attachRuntime(scene: Scene, engine: Engine): void {
    this.scene = scene;
    this.engine = engine;
    this.restoreLocalProject();
    this.select(scene.entities[0]);
    this.renderHierarchy();
    this.playing = true;
    const playButton = this.root.querySelector<HTMLButtonElement>('#play');
    const runtimeState = this.root.querySelector<HTMLElement>('#runtime-state');
    if (playButton) { playButton.textContent = '■ Stop'; playButton.classList.remove('primary-btn'); }
    if (runtimeState) runtimeState.textContent = 'Preview running';

    let dragging: Entity | undefined;
    let offsetX = 0;
    let offsetY = 0;
    this.canvas.addEventListener('pointerdown', event => {
      const rect = this.canvas.getBoundingClientRect();
      const x = (event.clientX - rect.left) * this.canvas.width / rect.width;
      const y = (event.clientY - rect.top) * this.canvas.height / rect.height;
      const hit = [...scene.entities].reverse().find(entity => {
        const t = entity.get<Transform>('Transform');
        return entity.active && t && x >= t.x && y >= t.y && x <= t.x + t.width && y <= t.y + t.height;
      });
      if (!hit) return;
      this.select(hit);
      const t = hit.get<Transform>('Transform')!;
      dragging = hit; offsetX = x - t.x; offsetY = y - t.y;
      this.canvas.setPointerCapture(event.pointerId);
    });
    this.canvas.addEventListener('pointermove', event => {
      if (!dragging) return;
      const rect = this.canvas.getBoundingClientRect();
      const t = dragging.get<Transform>('Transform');
      if (!t) return;
      t.x = (event.clientX - rect.left) * this.canvas.width / rect.width - offsetX;
      t.y = (event.clientY - rect.top) * this.canvas.height / rect.height - offsetY;
      const xInput = this.root.querySelector<HTMLInputElement>('#prop-x');
      const yInput = this.root.querySelector<HTMLInputElement>('#prop-y');
      if (xInput) xInput.value = String(Math.round(t.x));
      if (yInput) yInput.value = String(Math.round(t.y));
    });
    this.canvas.addEventListener('pointerup', () => { dragging = undefined; });
    this.canvas.addEventListener('pointercancel', () => { dragging = undefined; });
  }

  private restoreLocalProject(): void {
    try {
      const raw = localStorage.getItem('luqgameengine.project');
      if (!raw || !this.scene) return;
      const data = JSON.parse(raw) as SavedProject & { code?: string };
      if (data.format !== 'LuqGameProject/1' || !Array.isArray(data.entities)) return;
      this.scene.entities.splice(0);
      for (const saved of data.entities) {
        if (!saved || typeof saved.name !== 'string') continue;
        const entity = new Entity(saved.name);
        entity.active = saved.active !== false;
        if (saved.transform) entity.add(new Transform(saved.transform.x, saved.transform.y, saved.transform.width, saved.transform.height));
        if (saved.visual) entity.add(new Visual(saved.visual.shape, saved.visual.color));
        this.scene.add(entity);
      }
      this.scene.name = data.scene || 'Main Scene';
      if (Array.isArray(data.nodes3d)) this.threeD?.loadNodes(data.nodes3d);
      if (typeof data.code === 'string') this.editor?.setValue(data.code);
    } catch { this.setStatus('Saved project could not be restored'); }
  }

  private renderHierarchy(): void {
    const tree = this.root.querySelector<HTMLElement>('#hierarchy');
    if (!tree || !this.scene) return;
    tree.innerHTML = '';
    for (const entity of this.scene.entities) {
      const item = document.createElement('button');
      item.className = 'tree-item' + (entity === this.selected ? ' selected' : '');
      item.innerHTML = '<span class="tree-caret">›</span><span class="object-icon">▧</span><span></span><span class="tree-visible">●</span>';
      const label = item.querySelector('span:nth-child(3)');
      if (label) label.textContent = entity.name;
      item.addEventListener('click', () => this.select(entity));
      tree.append(item);
    }
  }

  private select(entity?: Entity): void {
    this.selected = entity;
    this.renderHierarchy();
    const panel = this.root.querySelector<HTMLElement>('#inspector-content');
    if (!panel) return;
    if (!entity) { panel.innerHTML = '<div class="empty-inspector">Select an object to edit its properties.</div>'; return; }
    const t = entity.get<Transform>('Transform') ?? new Transform();
    panel.innerHTML = '<label class="property-label">NAME<input id="prop-name" value="' + this.escapeAttr(entity.name) + '"></label>' +
      '<div class="property-section">TRANSFORM</div>' +
      this.numberField('Position X', 'prop-x', t.x) + this.numberField('Position Y', 'prop-y', t.y) +
      this.numberField('Width', 'prop-width', t.width) + this.numberField('Height', 'prop-height', t.height) +
      '<label class="toggle-row"><span>Active in scene</span><input id="prop-active" type="checkbox" ' + (entity.active ? 'checked' : '') + '></label>' +
      '<button class="danger-btn" id="delete-object">Delete object</button>';
    panel.querySelector<HTMLInputElement>('#prop-name')?.addEventListener('input', e => {
      entity.name = (e.target as HTMLInputElement).value || 'Object';
      this.renderHierarchy();
    });
    const bind = (id: string, key: 'x'|'y'|'width'|'height') => panel.querySelector<HTMLInputElement>('#' + id)?.addEventListener('input', e => {
      const value = Number((e.target as HTMLInputElement).value);
      if (Number.isFinite(value)) t[key] = value;
    });
    bind('prop-x','x'); bind('prop-y','y'); bind('prop-width','width'); bind('prop-height','height');
    panel.querySelector<HTMLInputElement>('#prop-active')?.addEventListener('change', e => { entity.active = (e.target as HTMLInputElement).checked; });
    panel.querySelector('#delete-object')?.addEventListener('click', () => {
      this.scene?.remove(entity.id);
      this.select(this.scene?.entities[0]);
      this.setStatus('Object deleted');
    });
  }

  private numberField(label: string, id: string, value: number): string {
    return '<label class="property-label">' + label + '<input id="' + id + '" type="number" step="1" value="' + value + '"></label>';
  }
  private escapeAttr(value: string): string { return value.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;'); }

  private addObject(): void {
    if (!this.scene) return;
    const entity = new Entity('Object ' + (this.scene.entities.length + 1));
    entity.add(new Transform(80 + this.scene.entities.length * 18, 80 + this.scene.entities.length * 12, 40, 40));
    this.scene.add(entity);
    this.select(entity);
    this.setStatus('Added ' + entity.name);
  }

  private snapshot(): SavedProject {
    return { format: 'LuqGameProject/1', scene: this.scene?.name ?? 'Main Scene', nodes3d: this.threeD?.listNodes() ?? [], entities: (this.scene?.entities ?? []).map(entity => {
      const t = entity.get<Transform>('Transform');
      const visual = entity.get<Visual>('Visual');
      return { name: entity.name, active: entity.active, transform: t ? { x:t.x, y:t.y, width:t.width, height:t.height } : undefined, visual: visual ? { shape: visual.shape, color: visual.color } : undefined };
    }) };
  }

  private saveProject(): void {
    try {
      localStorage.setItem('luqgameengine.project', JSON.stringify({ ...this.snapshot(), code: this.editor?.getValue() ?? '' }));
      this.setStatus('Project saved on this device');
    } catch { this.setStatus('Could not save project in local storage'); }
  }

  private exportProject(): void {
    const payload = { ...this.snapshot(), code: this.editor?.getValue() ?? '' };
    this.download(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }), 'my-game.luq.json');
    this.setStatus('Project exported as JSON');
  }

  private async importProject(file: File): Promise<void> {
    try {
      const data = JSON.parse(await file.text()) as { format: string; scene?: string; entities?: SavedEntity[]; nodes3d?: Scene3DNode[]; code?: string; dimension?: string; nodes?: Scene3DNode[]; parts?: Scene3DNode[] };
      if (!this.scene) throw new Error('Runtime is not ready');
      if (data.format === 'LuqGameScene/1' && Array.isArray(data.nodes)) {
        if (data.dimension === '3d') {
          this.threeD?.loadNodes(data.nodes);
          this.setMode('3d');
        } else {
          this.scene.entities.splice(0);
          for (const node of data.nodes) {
            const entity = new Entity(node.name);
            const position = node.position ?? {};
            const scale = node.scale ?? {};
            entity.add(new Transform(position.x ?? 0, position.y ?? 0, scale.x ?? 40, scale.y ?? 40));
            entity.add(new Visual(node.kind === 'circle2d' ? 'circle' : node.kind === 'sprite' ? 'sprite' : 'rect', node.color ?? '#60a5fa'));
            this.scene.add(entity);
          }
          this.setMode('2d');
          this.select(this.scene.entities[0]);
        }
        this.setStatus('Scene imported: ' + file.name);
        return;
      }
      if (data.format === 'LuqGameModel/1' && Array.isArray(data.parts)) {
        this.threeD?.loadNodes(data.parts.map(part => ({ ...part, kind: (part as Scene3DNode & { shape?: string }).shape ?? part.kind })));
        this.setMode('3d');
        this.setStatus('3D model imported: ' + file.name);
        return;
      }
      if (data.format !== 'LuqGameProject/1' || !Array.isArray(data.entities)) throw new Error('Unsupported project file');
      this.scene.entities.splice(0);
      for (const saved of data.entities) {
        if (!saved || typeof saved.name !== 'string') continue;
        const entity = new Entity(saved.name);
        entity.active = saved.active !== false;
        if (saved.transform) entity.add(new Transform(saved.transform.x, saved.transform.y, saved.transform.width, saved.transform.height));
        if (saved.visual) entity.add(new Visual(saved.visual.shape, saved.visual.color));
        this.scene.add(entity);
      }
      this.scene.name = data.scene || 'Main Scene';
      if (Array.isArray(data.nodes3d)) this.threeD?.loadNodes(data.nodes3d);
      if (typeof data.code === 'string') this.editor?.setValue(data.code);
      this.select(this.scene.entities[0]);
      this.setStatus('Project loaded: ' + file.name);
    } catch (error) { this.setStatus(error instanceof Error ? error.message : 'Project import failed'); }
  }

  private download(blob: Blob, name: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = name; link.click();
    URL.revokeObjectURL(url);
  }

  private togglePlay(): void {
    if (!this.engine) return;
    const button = this.root.querySelector<HTMLButtonElement>('#play');
    const state = this.root.querySelector<HTMLElement>('#runtime-state');
    if (this.playing) {
      this.engine.stop(); this.playing = false;
      if (button) { button.textContent = '▶ Play'; button.classList.add('primary-btn'); }
      if (state) state.textContent = 'Runtime stopped';
      this.setStatus('Preview stopped');
    } else {
      this.engine.start(); this.playing = true;
      if (button) { button.textContent = '■ Stop'; button.classList.remove('primary-btn'); }
      if (state) state.textContent = 'Preview running';
      this.setStatus('Preview running · press F5 to stop');
    }
  }

  setStatus(message: string): void { this.status.textContent = message; }
}
