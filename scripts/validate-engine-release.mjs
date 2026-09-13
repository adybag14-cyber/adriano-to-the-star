import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { gunzipSync, gzipSync } from 'node:zlib';
import {
    SCHEMA,
    POLICY,
    stableJSON,
    invariant,
    validatePacket,
    validateEvidence,
} from '../exoplanet-engine/contracts.js';
import { decide } from '../exoplanet-engine/policy.js';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'),
    artifact = process.argv.find((x) => x.startsWith('--artifact='))?.slice(11);
const dataRoot = path.resolve(root, artifact || '.', 'data/exoplanet-engine');
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const readJSON = async (p) => JSON.parse(await fs.readFile(p, 'utf8'));
function resolve(base, relative) {
    const p = path.resolve(base, relative);
    invariant(p.startsWith(base + path.sep), 'Release path escape');
    return p;
}
async function readAsset(base, asset) {
    invariant(/^[a-f0-9]{64}$/.test(asset.sha256), 'Missing asset hash');
    const bytes = await fs.readFile(resolve(base, asset.path));
    invariant(hash(bytes) === asset.sha256, 'Tampered asset: ' + asset.path);
    return bytes;
}
const pointer = await readJSON(path.join(dataRoot, 'current.json'));
invariant(pointer.schemaVersion === SCHEMA, 'Invalid current pointer');
const manifestBytes = await readAsset(dataRoot, pointer.manifest),
    manifest = JSON.parse(manifestBytes),
    releaseRoot = path.dirname(resolve(dataRoot, pointer.manifest.path));
invariant(
    manifest.schemaVersion === SCHEMA &&
        manifest.releaseId === pointer.releaseId &&
        manifest.policyVersion === POLICY,
    'Incompatible release manifest'
);
for (const [file, expected] of Object.entries(manifest.runtime?.files || {}))
    invariant(
        hash(await fs.readFile(resolve(releaseRoot, file))) === expected,
        'Runtime dependency hash mismatch: ' + file
    );
for (const [file, expected] of Object.entries(manifest.dependencies))
    invariant(
        hash(await fs.readFile(path.join(root, file))) === expected,
        `Release is stale for ${file}; rebuild it from reviewed inputs`
    );
const seen = new Set();
let objects = 0,
    solutions = 0,
    maxCompressed = 0;
for (const asset of Object.values(manifest.shards)) {
    const shard = JSON.parse(await readAsset(releaseRoot, asset));
    invariant(shard.releaseId === manifest.releaseId, 'Mixed shard release');
    for (const [id, entry] of Object.entries(shard.entries)) {
        invariant(!seen.has(id), 'Duplicate object index');
        seen.add(id);
        const bytes = await readAsset(releaseRoot, entry),
            envelope = JSON.parse(bytes),
            { evidence: e, packet: p } = envelope;
        invariant(
            e.object.id === id && envelope.releaseId === manifest.releaseId,
            'Wrong object/release in packet'
        );
        validatePacket(p, e);
        invariant(
            hash(stableJSON({ ...p, packetHash: null })) === p.packetHash,
            'Render packet hash mismatch'
        );
        invariant(
            stableJSON(decide(e)) === stableJSON(p.decision),
            'Appearance policy differs from the published packet'
        );
        for (const run of e.modelRuns)
            invariant(
                run.outputHash ===
                    hash(stableJSON(e.quantities.filter((q) => q.modelRunId === run.id))),
                'Derived model output hash mismatch'
            );
        const compressed = gzipSync(bytes).byteLength;
        maxCompressed = Math.max(maxCompressed, compressed);
        invariant(compressed <= 250000, 'Initial object metadata exceeds compressed budget');
        if (e.alternativeAsset) {
            const raw = gunzipSync(await readAsset(releaseRoot, e.alternativeAsset), {
                    maxOutputLength: 16 * 1024 * 1024,
                }),
                alternatives = JSON.parse(raw);
            invariant(
                alternatives.releaseId === manifest.releaseId && alternatives.objectId === id,
                'Mixed alternative parameter sets'
            );
            for (const alternative of alternatives.solutions) {
                validateEvidence(alternative);
                invariant(
                    alternative.object.id === id && alternative.releaseId === manifest.releaseId,
                    'Alternative identity changed'
                );
                solutions++;
            }
        }
        objects++;
    }
}
invariant(objects === manifest.statistics.objects && objects >= 9564, 'Incomplete indexed objects');
for (const id of ['K00752.01', 'K00752.02', 'K00129.02'])
    invariant(seen.has(id), 'Missing mandatory real fixture ' + id);
const niriss = await readJSON(
    path.join(root, 'data/exoplanet-engine/sources/niriss/manifest.json')
);
for (const [file, expected] of Object.entries(niriss.files))
    invariant(
        hash(await fs.readFile(path.join(root, 'data/exoplanet-engine/sources/niriss', file))) ===
            expected,
        'NIRISS source hash mismatch'
    );
console.log(
    JSON.stringify(
        {
            ok: true,
            releaseId: manifest.releaseId,
            objects,
            alternativeSolutions: solutions,
            maxCompressedObjectBytes: maxCompressed,
            sourcePolicy: 'reviewed immutable snapshots; no live upstream requests',
        },
        null,
        2
    )
);
