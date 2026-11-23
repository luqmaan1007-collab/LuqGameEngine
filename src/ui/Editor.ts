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
          <aside class="sidebar"><div class="panel-title">PROJECT</div><div class="file active">▸ Main Scene</div><div class="file">▸ Scripts / main.server.luau</div><div class="file">▸ Roblox / default.project.json</div><div class="file">▸ Plugins / sample.elg</div><div class="panel-title">LANGUAGES</div><div class="language-list">${languages.map(l=>`<span>${l.label}</span>`).join('')}</div></aside>
          <main class="center"><div class="tabs"><span class="tab selected">Game Preview</span><span class="tab">Script Editor</span></div><section class="preview"><canvas width="640" height="360"></canvas></section><section class="code-panel"><div class="code-toolbar"><span class="panel-title">CODE EDITOR</span><select id="language" aria-label="Programming language"></select></div><div id="code"></div></section></main>
          <aside class="inspector"><div class="panel-title">INSPECTOR</div><h3>Player</h3><label>Position X<input value="110" type="number"></label><label>Position Y<input value="110" type="number"></label><label>Width<input value="48" type="number"></label><label>Height<input value="48" type="number"></label><div class="panel-title">EXPORT TARGETS</div><div class="target">Android APK</div><div class="target">Roblox .rbxl</div><div class="target">Windows .exe</div><div class="target">macOS .dmg</div></aside>
        </div>
        <footer><span>● Runtime ready</span><span id="status">Initializing…</span><span>Touch / mouse / keyboard</span></footer>
      </div>`;
    const canvas = root.querySelector('canvas');
    const status = root.querySelector<HTMLElement>('#status');
    const code = root.querySelector<HTMLElement>('#code');
    const languageSelect = root.querySelector<HTMLSelectElement>('#language');
    if (!canvas || !status || !code || !languageSelect) throw new Error('Editor view failed');
    this.canvas = canvas;
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
      value: 'local Players = game:GetService("Players")\n\nlocal function onPlayerAdded(player: Player)\n    print("Welcome, " .. player.Name)\nend\n\nPlayers.PlayerAdded:Connect(onPlayerAdded)\n',
      language: 'luau', theme: 'vs-dark', automaticLayout: true, minimap: { enabled: false },
      fontSize: 13, scrollBeyondLastLine: false, wordWrap: 'on'
    });
    languageSelect.value = 'luau';
    languageSelect.addEventListener('change', () => {
      const selected = languages.find(item => item.id === languageSelect.value);
      if (!selected || !this.editor?.getModel()) return;
      const supported = monaco.languages.getLanguages().some(item => item.id === selected.monacoId);
      monaco.editor.setModelLanguage(this.editor.getModel()!, supported ? selected.monacoId : 'plaintext');
      this.setStatus(supported ? `Editing ${selected.label}` : `${selected.label}: text editing enabled; add a language adapter/toolchain for diagnostics and execution`);
    });
    root.querySelector('#play')?.addEventListener('click', () => this.setStatus('Preview running'));
    root.querySelector('#export')?.addEventListener('click', () => this.setStatus('Use the build scripts for APK, RBXL, EXE and DMG exports'));
  }

  setStatus(message: string): void { this.status.textContent = message; }
}
