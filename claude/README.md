# Claude AI Studio for LuqGameEngine

Claude connects through the Model Context Protocol (MCP). This is an **AI authoring bridge**, not a read-only chat panel. Claude can inspect and edit game code, author levels, generate maps, create procedural 3D models, and organize assets in the local LuqGameEngine project.

## Connect Claude Desktop

1. Clone the LuqGameEngine repository onto the computer running Claude Desktop.
2. Install Node.js 22 or newer.
3. Run `npm install` in the repository folder.
4. Open Claude Desktop's MCP configuration file.
5. Copy the server entry from `claude_desktop_config.example.json` and replace the placeholder with the absolute path to `mcp/server.mjs`.
6. Restart Claude Desktop. The LuqGameEngine tools should appear in Claude's available tools.

Do not put API keys or passwords in the MCP configuration.

## What Claude can do

- Inspect the project tree and read source files.
- Create or update engine source, Roblox source and AI workspace files.
- Write gameplay scripts in Luau, TypeScript, JavaScript, Python, Rust, C#, and GLSL.
- Create 2D and 3D scene documents.
- Add 2D sprites/rectangles/circles and 3D primitives, lights and cameras.
- Generate deterministic 2D tile maps and 3D terrain maps up to 48 × 48 tiles.
- Create reusable procedural 3D model descriptors from primitive assemblies or custom vertex/index meshes.
- Iterate on source files and scene/model data as the user requests.

Claude should explain significant changes and ask before broad destructive edits. MCP writes are restricted to `src/`, `roblox/src/`, and `ai-workspace/`; it blocks environment secrets, dependencies and Git metadata. Review AI-authored code before running or publishing it.

## Scene and model files

Claude-generated scenes use `LuqGameScene/1`; procedural models use `LuqGameModel/1`. Files are saved under `ai-workspace/scenes/` and `ai-workspace/models/`. Import a generated scene or model JSON with the editor's **Open** action.

The editor provides a 2D canvas and an interactive Three.js 3D viewport with orbit/zoom controls, a 3D hierarchy and object inspector. The current mesh generator supports primitive assemblies and custom triangle meshes.

The bridge does not automatically publish games, and it does not provide a sculpting UI or an independent AI model. Claude supplies the reasoning and authored content through MCP; the local engine renders and edits the resulting project assets.
