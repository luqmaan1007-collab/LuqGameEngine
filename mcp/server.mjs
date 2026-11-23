import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const WORKSPACE = path.join(ROOT, 'ai-workspace');
const server = new Server(
  { name: 'luqgameengine-ai-studio', version: '0.3.0' },
  { capabilities: { tools: {} } }
);

const tool = (name, description, properties = {}, required = [], annotations = {}) => ({
  name, description,
  inputSchema: { type: 'object', properties, required, additionalProperties: false },
  annotations
});
const string = (description, extra = {}) => ({ type: 'string', description, ...extra });
const number = (description, extra = {}) => ({ type: 'number', description, ...extra });
const enumString = (description, values) => ({ type: 'string', description, enum: values });

const tools = [
  tool('engine_status', 'Read engine version, current capabilities, project formats and build targets.', {}, [], { readOnlyHint: true }),
  tool('project_list_files', 'List source, Roblox and AI workspace files. Does not expose secrets or dependencies.', { directory: string('Optional relative directory, for example src or ai-workspace') }),
  tool('project_read_file', 'Read a project source or AI workspace file. Secret files and dependency folders are blocked.', { path: string('Project-relative file path') }, ['path'], { readOnlyHint: true }),
  tool('project_write_file', 'Create or update code and content inside src/, roblox/src/ or ai-workspace/. Claude should explain the intended change and ask before broad destructive edits.', { path: string('Project-relative destination path inside an allowed workspace'), content: string('Complete UTF-8 file contents') }, ['path','content']),
  tool('scene_create', 'Create a 2D or 3D scene document in ai-workspace/scenes.', { name: string('Scene name'), dimension: enumString('Scene type', ['2d','3d']) }, ['name','dimension']),
  tool('scene_add_object', 'Add a primitive, sprite, light or camera node to an existing LuqGame scene document.', {
    scene: string('Scene filename, for example island.scene.json'),
    name: string('Object name'),
    kind: enumString('Object type', ['box','sphere','cylinder','plane','sprite','rect2d','circle2d','point-light','directional-light','camera']),
    x: number('Position X'), y: number('Position Y'), z: number('Position Z'),
    scaleX: number('Scale X'), scaleY: number('Scale Y'), scaleZ: number('Scale Z'),
    color: string('Hex color, e.g. #55aa88')
  }, ['scene','name','kind']),
  tool('scene_generate_map', 'Generate a deterministic tile-based 3D terrain map scene. Dimensions are capped to protect project size.', {
    name: string('Map and scene name'),
    width: number('Map width in tiles', { minimum: 1, maximum: 48 }),
    depth: number('Map depth in tiles', { minimum: 1, maximum: 48 }),
    seed: number('Integer seed for reproducible terrain', { minimum: 0, maximum: 2147483647 }),
    tileSize: number('World-space tile size', { minimum: 0.5, maximum: 20 })
  }, ['name','width','depth']),
  tool('model_create', 'Create a reusable procedural 3D model descriptor made from primitive mesh parts.', {
    name: string('Model name'),
    parts: { type: 'array', minItems: 1, maxItems: 80, items: { type: 'object', properties: {
      name: string('Part name'),
      shape: enumString('Primitive mesh shape', ['box','sphere','cylinder','plane']),
      x: number('Position X'), y: number('Position Y'), z: number('Position Z'),
      sx: number('Scale X'), sy: number('Scale Y'), sz: number('Scale Z'),
      color: string('Hex material color')
    }, required: ['name','shape'], additionalProperties: false } }
  }, ['name','parts']),
  tool('script_create', 'Create a Luau, TypeScript, JavaScript, or other text script under ai-workspace/scripts.', {
    filename: string('Filename including extension'),
    language: enumString('Language', ['luau','typescript','javascript','python','rust','csharp','glsl']),
    code: string('Complete script contents')
  }, ['filename','language','code'])
];

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));

function safeRelative(input) {
  if (typeof input !== 'string' || !input.trim() || input.includes('\\') || path.isAbsolute(input)) throw new Error('A safe project-relative path is required');
  const normalized = path.posix.normalize(input);
  if (normalized === '..' || normalized.startsWith('../') || normalized.split('/').some(part => part === '.git' || part === 'node_modules' || part.startsWith('.env'))) {
    throw new Error('Path is outside the permitted project workspace');
  }
  return normalized;
}
function resolveRead(input) {
  const relative = safeRelative(input);
  const full = path.resolve(ROOT, relative);
  if (!full.startsWith(ROOT + path.sep)) throw new Error('Path escapes project root');
  return { relative, full };
}
function resolveWrite(input) {
  const target = resolveRead(input);
  const allowed = ['src/', 'roblox/src/', 'ai-workspace/'];
  if (!allowed.some(prefix => target.relative.startsWith(prefix))) throw new Error('Writes are limited to src/, roblox/src/ and ai-workspace/');
  const ext = path.extname(target.relative).toLowerCase();
  const extensions = new Set(['.ts','.tsx','.js','.mjs','.cjs','.lua','.luau','.json','.md','.css','.html','.glsl','.vert','.frag','.svg','.obj','.mtl','.scene']);
  if (!extensions.has(ext) && !target.relative.endsWith('.scene.json') && !target.relative.endsWith('.model.json')) throw new Error('File extension is not allowed for AI workspace writes');
  return target;
}
const slug = value => String(value).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 64) || 'untitled';
const output = value => ({ content: [{ type: 'text', text: typeof value === 'string' ? value : JSON.stringify(value, null, 2) }] });
const fail = error => ({ isError: true, content: [{ type: 'text', text: error instanceof Error ? error.message : String(error) }] });
async function readScene(filename) {
  const file = resolveRead(path.posix.join('ai-workspace/scenes', safeRelative(filename)));
  if (!file.relative.endsWith('.scene.json')) throw new Error('Scene filename must end in .scene.json');
  const data = JSON.parse(await fs.readFile(file.full, 'utf8'));
  if (data.format !== 'LuqGameScene/1' || !Array.isArray(data.nodes)) throw new Error('Unsupported scene format');
  return { file, data };
}

server.setRequestHandler(CallToolRequestSchema, async request => {
  try {
    const args = request.params.arguments ?? {};
    switch (request.params.name) {
      case 'engine_status':
        return output({ engine: 'LuqGameEngine', version: '0.3.0', appTargets: ['Android APK','Windows EXE','macOS DMG','Web'], contentTargets: ['Roblox RBXL','2D scenes','3D scenes','procedural models','terrain maps'], aiTools: ['read/write project files','create scripts','create scenes','add scene objects','generate terrain maps','create procedural models'], formats: ['LuqGameProject/1','LuqGameScene/1','LuqGameModel/1','ELG/1'], note: 'Claude uses these MCP tools to author project code and scene/model data. The running app must import or load generated scene assets.' });
      case 'project_list_files': {
        const base = args.directory ? resolveRead(args.directory).full : ROOT;
        const results = [];
        async function walk(dir, depth = 0) {
          if (depth > 5 || results.length >= 500) return;
          for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
            if (entry.name === '.git' || entry.name === 'node_modules' || entry.name.startsWith('.env')) continue;
            const full = path.join(dir, entry.name);
            if (entry.isDirectory()) await walk(full, depth + 1);
            else results.push(path.relative(ROOT, full).split(path.sep).join('/'));
            if (results.length >= 500) break;
          }
        }
        await walk(base);
        return output(results);
      }
      case 'project_read_file': {
        const file = resolveRead(args.path);
        const stat = await fs.stat(file.full);
        if (!stat.isFile() || stat.size > 1024 * 1024) throw new Error('File is missing or exceeds the 1 MB read limit');
        return output(await fs.readFile(file.full, 'utf8'));
      }
      case 'project_write_file': {
        const file = resolveWrite(args.path);
        if (typeof args.content !== 'string' || args.content.length > 500000) throw new Error('Content must be text under 500 KB');
        await fs.mkdir(path.dirname(file.full), { recursive: true });
        await fs.writeFile(file.full, args.content, 'utf8');
        return output({ saved: file.relative, bytes: Buffer.byteLength(args.content), message: 'File written to the project workspace' });
      }
      case 'scene_create': {
        const name = String(args.name ?? '').trim();
        if (!name) throw new Error('Scene name is required');
        if (!['2d','3d'].includes(args.dimension)) throw new Error('Scene dimension must be 2d or 3d');
        const filename = slug(name) + '.scene.json';
        const file = resolveWrite('ai-workspace/scenes/' + filename);
        await fs.mkdir(path.dirname(file.full), { recursive: true });
        const data = { format: 'LuqGameScene/1', name, dimension: args.dimension, version: 1, nodes: [], metadata: { createdBy: 'Claude via LuqGameEngine MCP' } };
        await fs.writeFile(file.full, JSON.stringify(data, null, 2) + '\n');
        return output({ scene: file.relative, ...data });
      }
      case 'scene_add_object': {
        const { file, data } = await readScene(args.scene);
        const name = String(args.name ?? '').trim();
        if (!name) throw new Error('Object name is required');
        const kind = String(args.kind ?? '');
        const valid = ['box','sphere','cylinder','plane','sprite','rect2d','circle2d','point-light','directional-light','camera'];
        if (!valid.includes(kind)) throw new Error('Unsupported scene object type');
        const n = value => Number.isFinite(Number(value)) ? Number(value) : 0;
        const node = { id: crypto.randomUUID(), name, kind, position: { x:n(args.x), y:n(args.y), z:n(args.z) }, scale: { x:n(args.scaleX ?? 1), y:n(args.scaleY ?? 1), z:n(args.scaleZ ?? 1) }, color: /^#[0-9a-fA-F]{6}$/.test(args.color ?? '') ? args.color : '#6da7ff', active: true };
        data.nodes.push(node);
        await fs.writeFile(file.full, JSON.stringify(data, null, 2) + '\n');
        return output({ scene: file.relative, added: node, nodeCount: data.nodes.length });
      }
      case 'scene_generate_map': {
        const name = String(args.name ?? '').trim();
        const width = Math.floor(Number(args.width)), depth = Math.floor(Number(args.depth));
        const seed = Math.floor(Number(args.seed ?? 1)), tileSize = Number(args.tileSize ?? 2);
        if (!name || !Number.isInteger(width) || !Number.isInteger(depth) || width < 1 || depth < 1 || width > 48 || depth > 48 || !Number.isFinite(tileSize) || tileSize <= 0) throw new Error('Map dimensions or tile size are invalid (maximum 48 by 48)');
        let state = seed >>> 0;
        const random = () => { state = (1664525 * state + 1013904223) >>> 0; return state / 4294967296; };
        const nodes = [];
        for (let z = 0; z < depth; z++) for (let x = 0; x < width; x++) {
          const wave = Math.sin(x * 0.24) * 0.8 + Math.cos(z * 0.21) * 0.65;
          const height = Math.max(0.2, Math.round((1.4 + wave + random() * 0.9) * 4) / 4);
          const water = height < 0.65;
          nodes.push({ id: crypto.randomUUID(), name: water ? 'Water ' + x + '-' + z : 'Terrain ' + x + '-' + z, kind: 'box', position: { x:(x - width/2)*tileSize, y:water ? -0.35 : height/2, z:(z - depth/2)*tileSize }, scale: { x:tileSize, y:water ? 0.5 : height, z:tileSize }, color: water ? '#2879a8' : height > 2.4 ? '#788a78' : '#628b58', active: true, tags: water ? ['water'] : ['terrain'] });
        }
        const file = resolveWrite('ai-workspace/scenes/' + slug(name) + '.scene.json');
        await fs.mkdir(path.dirname(file.full), { recursive: true });
        const data = { format: 'LuqGameScene/1', name, dimension: '3d', version: 1, nodes, metadata: { generator: 'LuqGameEngine terrain generator', seed, width, depth, tileSize } };
        await fs.writeFile(file.full, JSON.stringify(data, null, 2) + '\n');
        return output({ scene: file.relative, dimensions: [width, depth], objectCount: nodes.length, format: data.format });
      }
      case 'model_create': {
        const name = String(args.name ?? '').trim();
        if (!name || !Array.isArray(args.parts) || args.parts.length < 1 || args.parts.length > 80) throw new Error('Model requires a name and 1–80 primitive parts');
        const allowedShapes = new Set(['box','sphere','cylinder','plane']);
        const parts = args.parts.map((part, index) => {
          if (!part || !allowedShapes.has(part.shape) || typeof part.name !== 'string') throw new Error('Each model part needs a name and supported primitive shape');
          const num = value => Number.isFinite(Number(value)) ? Number(value) : 1;
          return { id: crypto.randomUUID(), name: part.name, shape: part.shape, position: { x:num(part.x ?? 0), y:num(part.y ?? 0), z:num(part.z ?? 0) }, scale: { x:num(part.sx ?? 1), y:num(part.sy ?? 1), z:num(part.sz ?? 1) }, color: /^#[0-9a-fA-F]{6}$/.test(part.color ?? '') ? part.color : '#8ab4f8' };
        });
        const filename = slug(name) + '.model.json';
        const file = resolveWrite('ai-workspace/models/' + filename);
        await fs.mkdir(path.dirname(file.full), { recursive: true });
        const data = { format: 'LuqGameModel/1', name, version: 1, parts };
        await fs.writeFile(file.full, JSON.stringify(data, null, 2) + '\n');
        return output({ model: file.relative, format: data.format, partCount: parts.length });
      }
      case 'script_create': {
        const extensions = { luau:'.luau', typescript:'.ts', javascript:'.js', python:'.py', rust:'.rs', csharp:'.cs', glsl:'.glsl' };
        const ext = extensions[args.language];
        if (!ext || typeof args.code !== 'string' || args.code.length > 200000) throw new Error('Unsupported language or script is too large');
        const base = slug(path.basename(String(args.filename ?? ''), path.extname(String(args.filename ?? ''))));
        const file = resolveWrite('ai-workspace/scripts/' + base + ext);
        await fs.mkdir(path.dirname(file.full), { recursive: true });
        await fs.writeFile(file.full, args.code, 'utf8');
        return output({ script: file.relative, language: args.language, bytes: Buffer.byteLength(args.code) });
      }
      default: throw new Error('Unknown tool: ' + request.params.name);
    }
  } catch (error) {
    return fail(error);
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
