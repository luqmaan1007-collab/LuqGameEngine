import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const transport = new StdioClientTransport({
  command: process.execPath,
  args: [path.join(root, 'mcp/server.mjs')]
});
const client = new Client({ name: 'luqgameengine-ci', version: '1.0.0' }, { capabilities: {} });

try {
  await client.connect(transport);
  const { tools } = await client.listTools();
  const expected = ['project_read_file','project_write_file','scene_create','scene_add_object','scene_generate_map','model_create','script_create'];
  for (const name of expected) {
    if (!tools.some(item => item.name === name)) throw new Error('Missing MCP tool: ' + name);
  }
  const sceneName = 'ci-mcp-smoke-test';
  const sceneFile = sceneName + '.scene.json';
  const created = await client.callTool({ name: 'scene_create', arguments: { name: sceneName, dimension: '3d' } });
  if (created.isError) throw new Error(JSON.stringify(created.content));
  const added = await client.callTool({ name: 'scene_add_object', arguments: { scene: sceneFile, name: 'CI Cube', kind: 'box', color: '#55aa88' } });
  if (added.isError) throw new Error(JSON.stringify(added.content));
  const map = await client.callTool({ name: 'scene_generate_map', arguments: { name: 'ci-mcp-map', width: 2, depth: 2, seed: 7, tileSize: 2 } });
  if (map.isError) throw new Error(JSON.stringify(map.content));
  const model = await client.callTool({ name: 'model_create', arguments: { name: 'ci-mcp-model', parts: [{ name: 'Body', shape: 'box' }] } });
  if (model.isError) throw new Error(JSON.stringify(model.content));
  const script = await client.callTool({ name: 'script_create', arguments: { filename: 'ci-smoke', language: 'typescript', code: 'export const ciSmokeTest = true;\n' } });
  if (script.isError) throw new Error(JSON.stringify(script.content));
  console.log('MCP smoke test passed: ' + tools.length + ' tools; scene, object, map, model and script creation verified.');
} finally {
  await client.close();
}
