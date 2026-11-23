# Claude AI Studio for LuqGameEngine

Claude connects through the Model Context Protocol (MCP). The bridge is designed so Claude can act as a game-development assistant: write project code, create scenes, build maps from terrain tiles, create procedural model descriptors, and inspect project files.

## Connect Claude Desktop

1. Install Node.js 22 or newer.
2. Run npm install in the LuqGameEngine repository.
3. Open Claude Desktop's MCP configuration file.
4. Copy the server entry from claude_desktop_config.example.json and replace the placeholder with the absolute path to mcp/server.mjs.
5. Restart Claude Desktop and enable the LuqGameEngine server.

Do not put API keys or passwords in the MCP configuration.

## What Claude can do

- Inspect the project tree and read source files.
- Create or update code in the engine, Roblox source, and AI workspace.
- Create 2D and 3D scene documents.
- Add primitive objects, lights, cameras and sprites to scenes.
- Generate deterministic tile-based 3D terrain maps up to 48 × 48 tiles.
- Create reusable procedural 3D model descriptors made from primitive meshes.
- Create scripts in Luau, TypeScript, JavaScript, Python, Rust, C#, and GLSL.

Claude should describe proposed changes and request approval before broad edits or destructive changes. MCP writes are restricted to src/, roblox/src/, and ai-workspace/; it cannot write secrets, dependencies, or Git metadata.

## Scene and model files

Claude-generated scenes use LuqGameScene/1; procedural models use LuqGameModel/1. Files are saved under ai-workspace/scenes/ and ai-workspace/models/. Import a generated scene or model JSON from the editor's Open action. The editor includes an interactive Three.js 3D viewport with orbit and zoom controls, plus the 2D canvas editor.

The bridge creates structured model/scene data and code. It does not claim to generate a finished sculpted mesh or publish a game automatically. Claude can iterate on the source and structured geometry, then the project can be exported through the platform-specific build workflows.
