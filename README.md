# LuqGameEngine

A cross-platform game creation environment with an Android-first workflow, a 2D/3D-capable runtime architecture, Roblox/Luau project export, plugin packages, and MCP bridges for AI coding assistants.

## Targets
- **Android:** editor/runtime web app packaged as an APK through Capacitor.
- **Roblox:** Luau source projects, Rojo build to `.rbxl`, optional publishing through Roblox Open Cloud.
- **Windows:** Tauri desktop app installer / `.exe`.
- **macOS:** Tauri desktop app / `.dmg`.
- **Web:** browser editor and playable preview.

## Included in this repository baseline
- TypeScript project and canvas game runtime with touch/pointer input.
- Scene/entity/component model.
- Monaco code editor and language registry, including Luau.
- Roblox project template and Rojo build script.
- Roblox Open Cloud publishing script (requires your own API key and Place ID; publish is an explicit action).
- ELG plugin package manifest and permission validation.
- MCP stdio server, Claude Desktop config example, and Claude Code plugin metadata.
- Capacitor Android setup and Tauri desktop build configuration.
- GitHub Actions workflows for Android APK and Windows/macOS releases.

## Quick start
```bash
npm install
npm run dev
```

## Android APK
```bash
npm run android:init
npm run android:sync
npm run android:apk
```
Requires Android SDK/NDK and JDK 17+.

## Roblox
Install Rust and Cargo, then:
```bash
cargo install rojo --locked
npm run roblox:build
``
Creates `dist/roblox-game.rbxl`. Roblox Studio is still useful for visual editing and final verification. Publishing requires an Open Cloud API key with place write permission and a Place ID:
```bash
ROBLOX_API_KEY=... ROBLOX_PLACE_ID=... npm run roblox:publish
``
The publish command deliberately requires `--publish` so an upload cannot happen accidentally.

## Claude / MCP
Run `npm run mcp` over stdio. Claude Desktop can connect using `claude/claude_desktop_config.example.json`; replace the example project path with the actual absolute path. Claude Code plugin metadata and MCP configuration are in `.claude-plugin/` and `.mcp.json`.

## ELG plugins
An `.elg` file is a JSON plugin package containing a manifest, declared permissions and source payloads. This baseline validates and imports package metadata; it does **not** execute arbitrary plugin code. Runtime capabilities and sandboxed execution are planned.

## Language support
The editor uses Monaco for syntax editing across many languages and provides a Luau language definition. Actual compilation/runtime execution depends on installed language toolchains or a registered ELG adapter. This is extensible, not a promise that every language ships with a compiler.

## Status
Early foundation, not a finished engine. 3D renderer, physics, animation, scene serialization, asset pipeline, robust sandboxing, signing/notarization, and device testing remain milestones. APK/EXE/DMG/RBXL files are produced by their respective platform build pipelines; they are not committed binaries.
