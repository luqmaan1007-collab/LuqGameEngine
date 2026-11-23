import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';

const server = new Server(
  { name: 'luqgameengine-bridge', version: '0.2.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    { name: 'engine_status', description: 'Read LuqGameEngine bridge status and supported project targets.', inputSchema: { type: 'object', properties: {}, additionalProperties: false } },
    { name: 'roblox_project_info', description: 'Read the configured Roblox project structure and export command.', inputSchema: { type: 'object', properties: {}, additionalProperties: false } }
  ]
}));

server.setRequestHandler(CallToolRequestSchema, async request => {
  const name = request.params.name;
  if (name === 'engine_status') {
    return { content: [{ type: 'text', text: JSON.stringify({ engine: 'LuqGameEngine', version: '0.2.0', targets: ['Android APK','Roblox RBXL','Windows EXE','macOS DMG','Web'], languages: ['Luau','TypeScript','JavaScript','Python','Rust','C','C++','C#','Java','Kotlin','Swift','Go','Ruby','PHP','SQL','Shell'], pluginFormat: 'ELG/1', mcp: 'stdio' }, null, 2) }] };
  }
  if (name === 'roblox_project_info') {
    return { content: [{ type: 'text', text: 'Roblox source is in roblox/src. Build with npm run roblox:build after installing Rojo. Publishing requires ROBLOX_API_KEY, ROBLOX_PLACE_ID and an explicit npm run roblox:publish.' }] };
  }
  throw new Error(`Unknown tool: ${name}`);
});

const transport = new StdioServerTransport();
await server.connect(transport);
