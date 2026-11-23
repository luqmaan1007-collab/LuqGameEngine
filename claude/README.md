# Connect Claude to LuqGameEngine

The MCP bridge uses stdio and is local to your machine.

1. Install project dependencies with `npm install`.
2. Copy the `luqgameengine` entry from `claude_desktop_config.example.json` into Claude Desktop's MCP configuration.
3. Replace the example path with the absolute path to this repository's `mcp/server.mjs`.
4. Restart Claude Desktop and check its MCP integrations for `luqgameengine`.

Claude can then call the read-only engine status and Roblox project information tools. Scene editing and build/publish actions will be added only with explicit permission and confirmation. Do not put API keys in this JSON file.
