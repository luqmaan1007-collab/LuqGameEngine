# LuqGameEngine

LuqGameEngine is an Android-first game creation app with a browser editor and native desktop builds. It includes 2D and interactive 3D scene editing, a Luau/Roblox pipeline, and an MCP bridge that lets Claude author project code and scene/model assets.

## Editor

- Responsive Android/mobile and desktop layouts.
- 2D canvas scene editor with object hierarchy, inspector, touch/mouse positioning and play/stop preview.
- Interactive Three.js 3D viewport with orbit and zoom controls.
- Primitive 3D objects and import of Claude-generated scene/model JSON.
- Monaco code editor with Luau highlighting and language selection.
- Local project save/restore and JSON import/export.
- ELG package manifest validation. Plugin code execution is not enabled yet.

## Platform targets

| Target | Build path | Output |
|---|---|---|
| Android | Capacitor + GitHub Actions | Debug APK |
| Windows | Tauri + GitHub Actions | NSIS .exe installer |
| macOS | Tauri + GitHub Actions | .dmg |
| Web | Vite | Browser app |
| Roblox | Rojo | .rbxl place file |

## Run the editor

    npm install
    npm run dev

## Android APK

    npm run android:init
    npm run android:sync
    npm run android:apk

The Android Actions workflow installs Android SDK platform 35 and uses Java 21. It uploads the debug APK as an artifact after a successful build.

## Desktop builds

Use the GitHub Actions Desktop packages workflow to build Windows and macOS packages. The workflow uploads separate artifacts for each operating system. Locally, install the Tauri prerequisites for your OS and run:

    npm run tauri:build

## Roblox

    cargo install rojo --locked
    npm run roblox:build

Creates dist/roblox-game.rbxl. Final playtesting should be done in Roblox Studio. Publishing requires a Roblox Open Cloud key, Place ID and an explicit publish action.

## Claude AI Studio / MCP

Run npm run mcp over stdio. Follow claude/README.md to connect Claude Desktop. Claude can inspect and write code, create 2D/3D scenes, add scene objects, generate deterministic 3D terrain maps, create procedural model descriptors, and create scripts. Writes are constrained to src/, roblox/src/, and ai-workspace/.

Generated scene files use LuqGameScene/1 and model files use LuqGameModel/1; import these JSON files with the editor's Open action. Claude's MCP tools provide the authoring interface; the connected Claude model supplies the AI reasoning and code/model design.

## ELG plugins

.elg packages currently validate metadata and requested permissions. Executable plugin sandboxing and a capability API are still future work. Do not treat manifest validation as plugin execution.

## Language support

The editor provides Monaco language modes and custom Luau highlighting. Language selection enables syntax editing where Monaco has a language mode. Compiling/running other languages requires their external toolchains or adapters.

## Current limitations

This is an early engine foundation, not a finished commercial 3D engine. The 3D viewport currently renders primitive meshes and imported structured scene/model data; full sculpting, advanced materials, physics, animation, audio authoring, asset marketplace, secure executable plugins, native on-device profiling, and a full Roblox runtime remain development work. Platform artifacts must pass their workflows and be tested on the target device before release.
