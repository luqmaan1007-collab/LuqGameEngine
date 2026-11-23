# LuqGameEngine

LuqGameEngine is an **Android-first game creation app** with a companion desktop editor for Windows and macOS. It combines 2D and 3D scene editing, scripting, Roblox project export, and an AI authoring bridge for Claude.

## Apps

- **Android:** Capacitor app; the primary mobile target.
- **Windows:** Tauri desktop application packaged as an NSIS installer (.exe).
- **macOS:** Tauri desktop application packaged as a .dmg.
- **Web:** Vite development and preview build.

All app targets use the same TypeScript editor and project formats.

## Editor

- Separate 2D Canvas and 3D Three.js viewports.
- Orbit controls, grid, lighting and primitive 3D geometry.
- 2D scene hierarchy, object selection, touch/mouse drag editing and property inspector.
- Play/stop preview, script editor with Luau and other language modes.
- Save/restore local projects and import/export `.luq.json`, `.scene.json`, and `.model.json` assets.
- Build pipelines for Android APK, Roblox `.rbxl`, Windows installer and macOS DMG.

## Claude AI authoring bridge (MCP)

The Claude MCP server is designed so Claude can **create and modify game projects**, not just inspect them. It exposes tools for:

- Reading, listing and writing project code and assets.
- Creating Luau, TypeScript, JavaScript, Python, Rust, C#, and GLSL scripts.
- Creating 2D and 3D scene documents and adding scene objects.
- Generating seeded 2D tile maps and 3D terrain maps.
- Creating procedural 3D models from primitives or custom vertex/index meshes.
- Creating project assets in the `ai-workspace/` directory.

Claude can use these tools to build levels, maps, models, gameplay scripts and project files. The current integration writes standard JSON scene/model assets; import them in the editor with **Open**. Claude's edits to source files are made in the local project folder where the MCP server runs. Review changes before building or publishing.

### Connect Claude Desktop

1. Clone this repository onto the computer running Claude Desktop.
2. Install Node.js 22 or later.
3. Run `npm ci` in the repository folder.
4. Copy `claude/claude_desktop_config.example.json` into Claude Desktop's MCP configuration and replace the placeholder with the absolute path to `mcp/server.mjs`.
5. Set `LUQGAMEENGINE_PROJECT` in the MCP entry to the absolute path of the game project you want Claude to edit.
6. Restart Claude Desktop and verify that the LuqGameEngine tools appear.

Example MCP configuration:

```json
{
  "mcpServers": {
    "luqgameengine": {
      "command": "node",
      "args": ["/absolute/path/to/LuqGameEngine/mcp/server.mjs"],
      "env": { "LUQGAMEENGINE_PROJECT": "/absolute/path/to/your/game-project" }
    }
  }
}
```

The MCP server has project-root path restrictions and blocks dependency, Git metadata and environment-secret paths. Claude Desktop asks the user to approve tool calls according to its own MCP permissions. Keep backups and review changes. The bridge does not itself provide an AI model or generate images outside the model's available capabilities.

## Development

```bash
npm ci
npm run dev
```

## Android APK

```bash
npm run android:init
npm run android:sync
npm run android:apk
```

GitHub Actions builds a debug APK and uploads it as an artifact.

## Roblox

Install Rust and Rojo:

```bash
cargo install rojo --locked
npm run roblox:build
```

Creates `dist/roblox-game.rbxl`. Final testing and publishing should be done through Roblox Studio / Roblox Open Cloud. Publishing requires a Roblox Open Cloud API key with place write permission and a Place ID; do not commit credentials.

## Desktop packages

The Desktop packages workflow creates a Windows NSIS installer and macOS DMG. Download artifacts from the GitHub Actions run. These are separate desktop packages, not Android APKs.

## ELG plugins

An `.elg` package currently supports manifest validation and permission declarations. Sandboxed execution and a full plugin SDK are not implemented yet; do not treat arbitrary plugin code as trusted.

## Current scope and limitations

The runtime currently contains a 2D canvas renderer and a Three.js 3D viewport with primitive/custom mesh loading. This is an early engine foundation, not a mature full game engine. Physics, animation, audio authoring, advanced material/shader graphs, robust asset importers, 3D scene hierarchy editing and on-device performance validation remain future work. Monaco language modes provide editing/highlighting; most languages still need compiler/runtime adapters before they can execute inside the engine.
