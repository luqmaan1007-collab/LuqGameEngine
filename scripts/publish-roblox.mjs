import { readFile } from 'node:fs/promises';

const enabled = process.argv.includes('--publish');
if (!enabled) throw new Error('Publishing is disabled. Pass --publish explicitly.');
const apiKey = process.env.ROBLOX_API_KEY;
const placeId = process.env.ROBLOX_PLACE_ID;
if (!apiKey || !placeId) throw new Error('Set ROBLOX_API_KEY and ROBLOX_PLACE_ID.');
if (!/^\\d+$/.test(placeId)) throw new Error('ROBLOX_PLACE_ID must be numeric.');

const file = process.env.ROBLOX_PLACE_FILE || 'dist/roblox-game.rbxl';
const bytes = await readFile(file);
const form = new FormData();
form.set('request', JSON.stringify({ assetId: Number(placeId), assetType: 'Place', published: true }));
form.set('fileContent', new Blob([bytes], { type: 'application/octet-stream' }), 'place.rbxl');

const response = await fetch(`https://apis.roblox.com/assets/v1/assets/${placeId}`, {
  method: 'PATCH',
  headers: { 'x-api-key': apiKey },
  body: form
});
const body = await response.json().catch(() => ({}));
if (!response.ok) throw new Error(`Roblox publish request failed (${response.status}): ${JSON.stringify(body)}`);
const operationPath = body.path;
if (!operationPath) throw new Error(`Roblox did not return an operation path: ${JSON.stringify(body)}`);

for (let attempt = 0; attempt < 30; attempt++) {
  await new Promise(resolve => setTimeout(resolve, 2000));
  const status = await fetch(`https://apis.roblox.com/assets/v1/${operationPath}`, { headers: { 'x-api-key': apiKey } });
  const result = await status.json().catch(() => ({}));
  if (!status.ok) throw new Error(`Could not read Roblox publish status: ${JSON.stringify(result)}`);
  if (result.done) {
    if (result.error) throw new Error(`Roblox publish failed: ${JSON.stringify(result.error)}`);
    console.log('Roblox place published:', JSON.stringify(result.response));
    process.exit(0);
  }
}
throw new Error('Roblox accepted the upload but the operation is still pending. Check it in Creator Dashboard.');
