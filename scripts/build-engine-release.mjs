import fs from 'node:fs/promises';
import path from 'node:path';
import { gunzipSync, gzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import {
    SCHEMA,
    POLICY,
    GENERATOR,
    stableJSON,
    validateEvidence,
    validatePacket,
    invariant,
} from '../exoplanet-engine/contracts.js';
import { normaliseNASA, slug, sourceLabel } from '../exoplanet-engine/nasa-adapter.js';
import { packetFor } from '../exoplanet-engine/policy.js';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceRoot = path.join(root, 'data/exoplanet-engine/sources/2026-09-13');
const outputArg = process.argv.find((a) => a.startsWith('--output='));
const output = path.resolve(root, outputArg?.slice(9) || 'data/exoplanet-engine');
const hash = (b) => createHash('sha256').update(b).digest('hex');
const readJSON = async (p) => JSON.parse(await fs.readFile(p, 'utf8'));
const sourceManifest = await readJSON(path.join(sourceRoot, 'manifest.accepted.json'));
const tables = {},
    sources = {};
for (const s of sourceManifest.sources) {
    invariant(s.review === 'accepted' && s.reviewedAt, 'Unreviewed source snapshot');
    const compressed = await fs.readFile(path.join(sourceRoot, s.path));
    invariant(hash(compressed) === s.compressedSha256, 'Compressed source hash mismatch');
    const raw = gunzipSync(compressed, { maxOutputLength: 64 * 1024 * 1024 });
    invariant(hash(raw) === s.sha256, 'Raw source hash mismatch');
    tables[s.id] = JSON.parse(raw);
    sources[s.id] = s;
    invariant(tables[s.id].length === s.rows, 'Source row count mismatch');
}
const engineFiles = (await fs.readdir(path.join(root, 'exoplanet-engine')))
    .filter((name) => /\.(js|css)$/.test(name))
    .sort();
const dependencyFiles = [
    ...engineFiles.map((name) => `exoplanet-engine/${name}`),
    'scripts/build-engine-release.mjs',
    'package-lock.json',
    'data/exoplanet-engine/supplements.json',
    'data/exoplanet-engine/sources/niriss/manifest.json',
    'data/exoplanet-engine/sources/niriss/transmission.csv',
    'data/exoplanet-engine/sources/niriss/published-model.txt',
];
const dependencies = Object.fromEntries(
    await Promise.all(
        dependencyFiles.map(async (p) => [p, hash(await fs.readFile(path.join(root, p)))])
    )
);
const releaseId = `2026-09-13-${hash(stableJSON({ sources: sourceManifest, dependencies, schema: SCHEMA, policy: POLICY, generator: GENERATOR })).slice(0, 16)}`;
const releaseRoot = path.join(output, 'releases', releaseId);
await fs.mkdir(path.join(releaseRoot, 'packets'), { recursive: true });
await fs.mkdir(path.join(releaseRoot, 'alternatives'), { recursive: true });
await fs.mkdir(path.join(releaseRoot, 'index'), { recursive: true });
await fs.mkdir(path.join(releaseRoot, 'runtime'), { recursive: true });
const runtime = { entry: 'runtime/viewer.js', files: {} };
for (const name of engineFiles) {
    const bytes = await fs.readFile(path.join(root, 'exoplanet-engine', name));
    await fs.writeFile(path.join(releaseRoot, 'runtime', name), bytes);
    runtime.files[`runtime/${name}`] = hash(bytes);
}
const vendorRoot = path.join(releaseRoot, 'vendor/exoplanet/0.186.0');
await fs.mkdir(vendorRoot, { recursive: true });
for (const name of ['three.webgpu.js', 'three.core.js']) {
    const bytes = await fs.readFile(path.join(root, 'node_modules/three-engine/build', name));
    await fs.writeFile(path.join(vendorRoot, name), bytes);
    runtime.files[`vendor/exoplanet/0.186.0/${name}`] = hash(bytes);
}
await fs.copyFile(
    path.join(root, 'node_modules/three-engine/LICENSE'),
    path.join(vendorRoot, 'LICENSE')
);
await fs.mkdir(path.join(output, 'assets'), { recursive: true });
const cie = await fs.readFile(path.join(root, 'data/exoplanet-engine/CIE_xyz_1931_2deg.csv'));
await fs.writeFile(path.join(output, 'assets', hash(cie) + '.csv'), cie);
async function writeAsset(directory, value, compress = false) {
    let bytes = Buffer.from(stableJSON(value) + '\n');
    if (compress) bytes = gzipSync(bytes, { level: 9, mtime: 0 });
    const sha256 = hash(bytes),
        relative = `${directory}/${sha256}.json${compress ? '.gz' : ''}`;
    const dest = path.join(releaseRoot, relative);
    try {
        await fs.writeFile(dest, bytes, { flag: 'wx' });
    } catch (error) {
        if (error.code !== 'EEXIST') throw error;
        invariant(hash(await fs.readFile(dest)) === sha256, 'Immutable asset already differs');
    }
    return { path: relative, sha256, bytes: bytes.length };
}
const byName = new Map();
for (const row of tables.ps) {
    const list = byName.get(row.pl_name) || [];
    list.push(row);
    byName.set(row.pl_name, list);
}
const oldRows = (await fs.readFile(path.join(root, 'data/exoplanets.jsonl'), 'utf8'))
    .trim()
    .split(/\r?\n/)
    .map(JSON.parse);
const oldMap = new Map(oldRows.map((r) => [r.kepoi_name, r]));
const supplements = await readJSON(path.join(root, 'data/exoplanet-engine/supplements.json'));
const knownNames = new Set(tables.koi.map((r) => r.kepler_name).filter(Boolean));
const objects = [
    ...tables.koi.map((koi) => ({
        id: koi.kepoi_name,
        koi,
        name: koi.kepler_name || koi.kepoi_name,
    })),
    ...[...byName.keys()]
        .filter((name) => !knownNames.has(name) && !name.startsWith('Kepler-'))
        .map((name) => ({ id: `nea-${slug(name)}`, koi: null, name })),
];
const buckets = {},
    counts = {},
    featured = [],
    statusChanges = [];
let largestPacket = 0,
    totalPacketBytes = 0;
function supplement(e) {
    const s = supplements.objects[e.object.canonicalName];
    if (!s) return e;
    for (const source of s.citations)
        e.citations.push({
            ...source,
            retrievedAt: supplements.reviewedAt,
            lastVerifiedAt: supplements.reviewedAt,
            snapshotHash: null,
            redistributionNote:
                'Citation metadata and qualified claims only; publication full text is not redistributed.',
        });
    for (const claim of s.claims)
        e.claims.push({
            ...claim,
            objectId: e.object.id,
            review: 'accepted',
            observationEpoch: claim.observationEpoch || null,
            dependenceGroupId: claim.dependenceGroupId || claim.id,
        });
    e.chemicalClaims = s.chemicalClaims || [];
    e.observations = s.observations || [];
    return e;
}
function finalize(e) {
    for (const run of e.modelRuns)
        run.outputHash = hash(stableJSON(e.quantities.filter((q) => q.modelRunId === run.id)));
    return e;
}
for (const object of objects) {
    const rows = byName.get(object.name) || [],
        defaults = rows.filter((r) => r.default_flag === 1);
    invariant(defaults.length <= 1, `Ambiguous default reference for ${object.name}`);
    const ps = defaults[0] || null;
    if (!ps && !object.koi) continue;
    const previous = oldMap.get(object.id)?.status || null;
    const e = finalize(
        supplement(
            normaliseNASA({
                koi: object.koi,
                ps,
                objectId: object.id,
                releaseId,
                sources,
                oldStatus: previous,
            })
        )
    );
    e.generatorHashes = {
        terrain: dependencies['exoplanet-engine/terrain.js'],
        recipes: dependencies['exoplanet-engine/recipes.js'],
        physics: dependencies['exoplanet-engine/physics.js'],
        optics: dependencies['exoplanet-engine/optics.js'],
    };
    const alternatives = [];
    // All reference-specific solutions remain available as one lazy compressed asset.
    for (let i = 0; i < rows.length; i++) {
        if (rows[i] === ps) continue;
        const alt = normaliseNASA({
            koi: object.koi,
            ps: rows[i],
            objectId: object.id,
            releaseId,
            sources,
            oldStatus: previous,
            parameterSetId: `${object.id}:ps-solution-${i}`,
        });
        finalize(alt);
        validateEvidence(alt);
        alternatives.push(alt);
    }
    if (ps && object.koi) {
        const alt = finalize(
            normaliseNASA({
                koi: object.koi,
                objectId: object.id,
                releaseId,
                sources,
                oldStatus: previous,
            })
        );
        validateEvidence(alt);
        alternatives.push(alt);
    }
    if (alternatives.length) {
        e.alternativeIndex = alternatives.map((a) => ({
            id: a.adoptedParameterSetId,
            label: a.parameterSets[0].label,
        }));
        e.alternativeAsset = await writeAsset(
            'alternatives',
            { schemaVersion: SCHEMA, releaseId, objectId: object.id, solutions: alternatives },
            true
        );
    }
    e.spectralProducts = tables.spectra
        .filter((s) => s.pl_name === object.name)
        .map((s) => ({
            kind: 'archive_metadata',
            observable: s.spec_type,
            instrument: s.instrument,
            facility: s.facility,
            wavelengthUnit: 'micrometre',
            wavelengthRange: [s.minwavelng, s.maxwavelng],
            bibcode: s.bibcode,
            authors: s.authors,
            numberOfSamples: s.num_datapoints,
            sourceURL: catalogueURLForSpectrum(object.name),
            fileLocator: s.spec_path,
            status: 'Metadata only for this archive row. Individually imported observation products are listed separately.',
        }));
    validateEvidence(e);
    const packet = packetFor(e);
    packet.packetHash = hash(stableJSON(packet));
    validatePacket(packet, e);
    const asset = await writeAsset('packets', {
        schemaVersion: SCHEMA,
        releaseId,
        evidence: e,
        packet,
    });
    largestPacket = Math.max(largestPacket, asset.bytes);
    totalPacketBytes += asset.bytes;
    const bucket = object.id.startsWith('K') ? object.id.slice(0, 4) : 'nea';
    buckets[bucket] ??= {};
    buckets[bucket][object.id] = asset;
    counts[packet.decision.mode] = (counts[packet.decision.mode] || 0) + 1;
    if (
        [
            'K00752.01',
            'K00752.02',
            'K00129.02',
            'nea-wasp-39-b',
            'nea-hd-189733-b',
            'nea-trappist-1-e',
            'nea-lhs-3844-b',
            'nea-55-cnc-e',
        ].includes(object.id)
    )
        featured.push({
            id: object.id,
            name: e.object.canonicalName,
            status: e.object.existence.status,
            mode: packet.decision.mode,
        });
    const oldNormal = previous?.toLowerCase().replace(' planet', '').replace(' ', '_');
    if (previous && oldNormal !== e.object.existence.status)
        statusChanges.push({
            id: object.id,
            before: previous,
            after: e.object.existence.status,
            source: e.object.existence.rationale,
        });
}
function catalogueURLForSpectrum(name) {
    const u = new URL('https://exoplanetarchive.ipac.caltech.edu/TAP/sync');
    u.searchParams.set(
        'query',
        `select * from spectra where pl_name='${name.replaceAll("'", "''")}'`
    );
    u.searchParams.set('format', 'json');
    return u.href;
}
function safeSpectrumPath(value) {
    if (!value) return null;
    const u = new URL(value, 'https://exoplanetarchive.ipac.caltech.edu/');
    return u.protocol === 'https:' && u.hostname === 'exoplanetarchive.ipac.caltech.edu'
        ? u.href
        : null;
}
const shards = {};
for (const [bucket, entries] of Object.entries(buckets))
    shards[bucket] = await writeAsset('index', { schemaVersion: SCHEMA, releaseId, entries });
const manifest = {
    schemaVersion: SCHEMA,
    releaseId,
    policyVersion: POLICY,
    generatorVersion: GENERATOR,
    reviewedAt: sources.koi.reviewedAt,
    sourceManifest,
    dependencies,
    runtime,
    shards,
    featured,
    statistics: {
        objects: Object.values(buckets).reduce((n, b) => n + Object.keys(b).length, 0),
        modes: counts,
        largestPacketBytes: largestPacket,
        totalPacketBytes,
    },
    statusChanges,
    limitations: [
        'Catalogue reference solutions are not a complete literature review.',
        'No source spectrum count is interpreted as a molecule detection.',
        'False-positive catalogue dispositions are retained separately from paper retractions.',
    ],
};
invariant(manifest.statistics.objects >= 9564, 'Incomplete release');
const manifestBytes = Buffer.from(stableJSON(manifest) + '\n'),
    manifestHash = hash(manifestBytes);
await fs.writeFile(path.join(releaseRoot, 'manifest.json'), manifestBytes);
await fs.writeFile(
    path.join(output, 'current.json'),
    stableJSON({
        schemaVersion: SCHEMA,
        releaseId,
        manifest: { path: `releases/${releaseId}/manifest.json`, sha256: manifestHash },
    }) + '\n'
);
console.log(
    JSON.stringify(
        {
            releaseId,
            ...manifest.statistics,
            shards: Object.keys(shards).length,
            featured,
            statusChanges,
        },
        null,
        2
    )
);
