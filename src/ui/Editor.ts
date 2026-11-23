import * as monaco from 'monaco-editor';
import { languages } from '../languages/registry';

export class Editor {
  readonly canvas: HTMLCanvasElement;
  private status!: HTMLElement;
  private editor?: monaco.editor.IStandaloneCodeEditor;

  constructor(private readonly root: HTMLElement) {
    root.innerHTML = `
      <div class="app-shell">
        <header class="topbar"><div class="brand-mark">L</div><strong>LuqGameEngine</strong><span class="version">0.2 DEV</span><nav><button id="play">▶ Play</button><button id="export">Export</button></nav></header>
        <div class="layout">
          <aside class="sidebar"><div class="panel-title">PROJECT</div><div class="file active">▸ Main Scene</div><div class="file">▸ Scripts / main.server.luau</div><div class="file">▸ Roblox / default.project.json</div><div class="file">▸ Plugins / sample.elg</div><div class="panel-title">LANGUAGES</div><div class="language-list">${languages.slice(0,16).map(l=>`<span>${l.label}</span>`).join('')}</div></aside>
          <main class="center"><div class="tabs"><span class="tab selected">Game Preview</span><span class="tab">main.server.luau</span></div><section class="preview"><canvas width="640" height="360"></canvas></section><section class="code-panel"><div class="panel-title">SCRIPT EDITOR · LUAU</div><div id="code"></div></section></main>
          <aside class="inspector"><div class="panel-title">INSPECTOR</div><h3>Player</h3><label>Position X<input value="110" type="number"></label><label>Position Y<input value="110" type="number"></label><label>Width<input value="48" type="number"></label><label>Height<input value="48" type="number"></label><div class="panel-title">EXPORT TARGETS</div><div class="target">Android APK</div><div class="target">Roblox .rbxl</div><div class="target">Windows .exe</div><div class="target">macOS .dmg</div></aside>
        </div>
        <footer><span>● Runtime ready</span><span id="status">Initializing…</span><span>Touch / mouse / keyboard</span></footer>
      </div>`;
    const canvas = root.querySelector('canvas');
    const status = root.querySelector<HTMLElement>('#status');
    if (!canvas || !status) throw new Error('Editor view failed');
    this.canvas = canvas; this.status = status;
    const code = root.querySelector<HTMLElement>('#code');
    if (code) {
      this.editor = monaco.editor.create(code, {
        value: 'local Players = game:GetService("Players")\n\nlocal function onPlayerAdded(player: Player)\n    print("Welcome, " .. player.Name)\nend\n\nPlayers.PlayerAdded:Connect(onPlayerAdded)\n',
        language: 'luau', theme: 'vs-dark', automaticLayout: true, minimap: { enabled: false },
        fontSize: 13, scrollBeyondLastLine: false, wordWrap: 'on'
      });
    }
    root.querySelector('#play')?.addEventListener('click', () => this.setStatus('Preview running'));
    root.querySelector('#export')?.addEventListener('click', () => this.setStatus('Choose an export target from the project build menu'));
  }

  setStatus(message: string): void { this.status.textContent = message; }
}
