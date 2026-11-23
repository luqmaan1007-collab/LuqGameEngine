# LuqGameEngine

LuqGameEngine is an Android-first game creation workspace with a browser editor, scene preview, Luau/Roblox project pipeline, and desktop packaging targets.

## Editor features

- Responsive editor layout designed for mobile and desktop.
- Scene hierarchy with object selection and deletion.
- 2D canvas viewport with direct touch/mouse drag positioning.
- Inspector for object name, position, dimensions, and active state.
- Play/stop preview controls and F5 shortcut.
- Monaco script editor with Luau highlighting and a language selector.
- Save project locally (Ctrl/Cmd+S), restore the saved project on next launch, import and export .luq.json project files.
- ELG package manifest validation and permission checks.

## Platform targets

| Target | Build path | Output |
|---|---|---|
| Android | Capacitor + GitHub Actions | Debug APK |
| Roblox | Rojo | .rbxl |
| Windows | Tauri | .exe installer |
| macOS | Tauri | .dmg |
| Web | Vite | Browser app |

## Run locally

~~~bash
npm install
npm run dev
~~~

## Android APK

~~~bash
npm run android:init
npm run android:sync
npm run android:apk
~~~

The Android workflow also runs from GitHub Actions and uploads the APK as a build artifact.

## Roblox project

Install Rust and Rojo, then run:

~~~bash
cargo install rojo --locked
npm run roblox:build
~~~

Creates dist/roblox-game.rbxl. Roblox Studio is recommended for final playtesting and inspection. Publishing requires a Roblox Open Cloud API key with place write permission and a Place ID:

~~~bash
ROBLOX_API_KEY=... ROBLOX_PLACE_ID=... npm run roblox:publish
~~~

The publish script requires an explicit publish flag to prevent accidental uploads.

## Desktop packages

The Tauri workflow builds a Windows installer and macOS disk image. Run it manually from the Actions tab when the workflow is enabled.

## Claude / MCP

Run npm run mcp over stdio. The example Claude Desktop configuration is in claude/claude_desktop_config.example.json. The current MCP server exposes read-only project inspection tools.

## ELG plugins

An .elg file uses the ELG/1 JSON manifest format. The current plugin manager validates metadata, entrypoint presence, and declared permissions. It does not execute plugin code; safe sandboxed plugin execution is still future work.

## Language support

The editor includes Monaco language modes and a custom Luau tokenizer. Language selection enables syntax editing where Monaco provides a language service. Running or compiling other languages requires their external toolchains/adapters.

## Current limitations

This is an actively developed engine foundation, not yet a full commercial-grade 3D engine. The current runtime is 2D Canvas-based. A 3D renderer, physics, animation, asset browser/import pipeline, scene serialization beyond the project JSON format, secure plugin sandbox, and on-device performance testing remain outstanding. Roblox, Android, Windows, and macOS outputs must be built and tested through their platform workflows before being considered release-ready.
