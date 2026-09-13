import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const base = new URL(process.env.ENGINE_BASE_URL || 'https://adrianotothestar.com/');
const pointer = JSON.parse(
    await fs.readFile(path.join(root, 'data/exoplanet-engine/current.json'), 'utf8')
);
const hash = (b) => createHash('sha256').update(b).digest('hex');
const nonce = `${process.env.CI_PIPELINE_ID || 'manual'}-${Date.now()}`;
async function get(relative) {
    const url = new URL(relative, base);
    url.searchParams.set('engineProbe', nonce);
    const r = await fetch(url, { signal: AbortSignal.timeout(20000), cache: 'no-store' });
    if (!r.ok) throw new Error(`${relative}: HTTP ${r.status}`);
    return { bytes: Buffer.from(await r.arrayBuffer()), type: r.headers.get('content-type') };
}
const html = (await get('database.html')).bytes.toString();
if (!html.includes(`data-evidence-release="${pointer.releaseId}"`))
    throw new Error('Public database HTML does not bind the expected evidence release');
const manifestResponse = await get(`data/exoplanet-engine/${pointer.manifest.path}`);
if (hash(manifestResponse.bytes) !== pointer.manifest.sha256)
    throw new Error('Public evidence manifest differs from the candidate');
const manifest = JSON.parse(manifestResponse.bytes),
    releaseBase = `data/exoplanet-engine/releases/${pointer.releaseId}/`;
const shardAsset = manifest.shards.K007,
    shardResponse = await get(releaseBase + shardAsset.path);
if (hash(shardResponse.bytes) !== shardAsset.sha256)
    throw new Error('Public object index hash differs');
const asset = JSON.parse(shardResponse.bytes).entries['K00752.01'],
    packet = await get(releaseBase + asset.path);
if (hash(packet.bytes) !== asset.sha256) throw new Error('Public Kepler-227 b packet hash differs');
for (const file of [
    'runtime/viewer.js',
    'runtime/renderer.js',
    'runtime/terrain-worker.js',
    'vendor/exoplanet/0.186.0/three.webgpu.js',
]) {
    const response = await get(releaseBase + file);
    if (hash(response.bytes) !== manifest.runtime.files[file])
        throw new Error(`Public runtime mismatch: ${file}`);
    if (!/javascript|ecmascript/i.test(response.type || ''))
        throw new Error(`Unexpected module MIME type: ${file}: ${response.type}`);
}
console.log(
    JSON.stringify(
        {
            ok: true,
            releaseId: pointer.releaseId,
            object: 'K00752.01',
            sourceAndRuntimeHashesVerified: true,
            origin: base.origin,
        },
        null,
        2
    )
);
