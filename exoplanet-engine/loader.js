import {
    SCHEMA,
    MAX_PACKET_BYTES,
    invariant,
    sha256,
    stableJSON,
    freeze,
    validatePacket,
    validateEvidence,
    evidenceBase,
} from './contracts.js';
import { compilePacket } from './policy.js';
const baseURL = evidenceBase(import.meta.url);
const CACHE = 'ita-exoplanet-evidence-v1';
const MAX_CACHE_ENTRIES = 48,
    MAX_CACHE_BYTES = 12 * 1024 * 1024;
export function shardFor(id) {
    invariant(/^K\d{5}\.\d{2}$|^nea-[a-z0-9-]{1,100}$/.test(id), 'Invalid catalogue identifier');
    return id.startsWith('K') ? id.slice(0, 4) : 'nea';
}
function localURL(relative, base = baseURL) {
    const u = new URL(relative, base);
    invariant(
        u.origin === baseURL.origin &&
            u.pathname.startsWith(baseURL.pathname) &&
            !u.username &&
            !u.password,
        'Asset outside the evidence release'
    );
    return u;
}
async function cacheOpen() {
    try {
        return await caches.open(CACHE);
    } catch {
        return null;
    }
}
async function bounded(response, max, signal) {
    invariant(response.ok, 'Evidence request failed: HTTP ' + response.status);
    const reader = response.body?.getReader();
    if (!reader) {
        const bytes = new Uint8Array(await response.arrayBuffer());
        invariant(bytes.byteLength <= max, 'Oversized evidence asset');
        return bytes;
    }
    const chunks = [];
    let total = 0;
    try {
        while (true) {
            signal?.throwIfAborted();
            const { done, value } = await reader.read();
            if (done) break;
            total += value.length;
            if (total > max) throw new Error('Oversized evidence asset');
            chunks.push(value);
        }
    } catch (e) {
        await reader.cancel().catch(() => {});
        throw e;
    }
    const bytes = new Uint8Array(total);
    let offset = 0;
    for (const c of chunks) {
        bytes.set(c, offset);
        offset += c.length;
    }
    return bytes;
}
async function remember(cache, url, bytes) {
    if (!cache) return;
    try {
        await cache.delete(url);
        await cache.put(url, new Response(bytes));
        const keys = await cache.keys();
        let retainedBytes = 0,
            retainedCount = 0;
        for (const key of keys.reverse()) {
            const r = await cache.match(key);
            const n = (await r.arrayBuffer()).byteLength;
            retainedBytes += n;
            retainedCount++;
            if (retainedCount > MAX_CACHE_ENTRIES || retainedBytes > MAX_CACHE_BYTES)
                await cache.delete(key);
        }
    } catch {
        /* Cache availability is independent of evidence validity. */
    }
}
async function verifiedFetch(
    url,
    expectedHash,
    { signal, max = MAX_PACKET_BYTES, cache, cacheFirst = false, encoding = 'json' } = {}
) {
    const decode = async (bytes) => {
        invariant(
            !expectedHash || (await sha256(bytes)) === expectedHash,
            'Evidence content hash mismatch'
        );
        if (encoding === 'gzip') {
            invariant(
                typeof DecompressionStream === 'function',
                'This browser cannot expand alternative parameter sets'
            );
            bytes = await bounded(
                new Response(
                    new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))
                ),
                16 * 1024 * 1024,
                signal
            );
        }
        return JSON.parse(new TextDecoder().decode(bytes));
    };
    const cached = await cache?.match(url);
    if (cacheFirst && cached) {
        try {
            return {
                value: await decode(new Uint8Array(await cached.arrayBuffer())),
                stale: false,
            };
        } catch {
            await cache.delete(url);
        }
    }
    try {
        const deadline = AbortSignal.timeout(10000),
            combined = signal ? AbortSignal.any([signal, deadline]) : deadline;
        const response = await fetch(url, {
            signal: combined,
            cache: expectedHash ? 'force-cache' : 'no-cache',
            credentials: 'omit',
        });
        const bytes = await bounded(response, max, combined);
        const value = await decode(bytes);
        await remember(cache, url, bytes);
        return { value, stale: false };
    } catch (error) {
        if (signal?.aborted) throw error;
        if (cached) {
            try {
                return {
                    value: await decode(new Uint8Array(await cached.clone().arrayBuffer())),
                    stale: true,
                    refreshError: error.message,
                };
            } catch {
                /* Reject damaged cached bytes too. */
            }
        }
        throw error;
    }
}
export class EvidenceLoader {
    constructor() {
        this.generation = 0;
        this.controller = null;
        this.context = null;
    }
    cancel() {
        this.generation++;
        this.controller?.abort();
    }
    async load(id, options = {}) {
        shardFor(id);
        try {
            const result = await this.loadRelease(id, options),
                cache = await cacheOpen();
            await remember(
                cache,
                localURL(`last-good/${id}`),
                new TextEncoder().encode(
                    stableJSON({
                        schemaVersion: SCHEMA,
                        releaseId: result.releaseId,
                        manifestHash: result.manifestHash,
                    })
                )
            );
            return result;
        } catch (error) {
            if (
                error.name === 'AbortError' ||
                this.controller?.signal.aborted ||
                (options.releaseId && !options.allowCompatibleFallback)
            )
                throw error;
            const cache = await cacheOpen(),
                saved = await cache?.match(localURL(`last-good/${id}`));
            if (!saved) throw error;
            try {
                const last = await saved.json();
                invariant(last.schemaVersion === SCHEMA, 'Incompatible last-known-good release');
                const result = await this.loadRelease(id, {
                    ...options,
                    releaseId: last.releaseId,
                    expectedManifestHash: last.manifestHash,
                });
                this.context = freeze({ ...result, stale: true, refreshError: error.message });
                return this.context;
            } catch (fallbackError) {
                if (fallbackError.name === 'AbortError') throw fallbackError;
                throw error;
            }
        }
    }
    async loadRelease(
        id,
        { releaseId = null, expectedManifestHash = null, onProgress = () => {} } = {}
    ) {
        this.cancel();
        const generation = this.generation,
            controller = (this.controller = new AbortController()),
            signal = controller.signal,
            cache = await cacheOpen();
        const bucket = shardFor(id);
        onProgress('Loading the evidence release…');
        let manifestURL,
            expectedHash,
            pointer,
            stale = false;
        if (releaseId) {
            invariant(
                /^\d{4}-\d{2}-\d{2}-[a-f0-9]{16}$/.test(releaseId),
                'Invalid saved evidence release'
            );
            manifestURL = localURL(`releases/${releaseId}/manifest.json`);
            expectedHash = expectedManifestHash;
        } else {
            const result = await verifiedFetch(localURL('current.json'), null, {
                signal,
                cache,
                max: 4096,
            });
            pointer = result.value;
            stale = result.stale;
            invariant(
                pointer.schemaVersion === SCHEMA && pointer.manifest?.sha256,
                'Incompatible release pointer'
            );
            releaseId = pointer.releaseId;
            invariant(
                /^\d{4}-\d{2}-\d{2}-[a-f0-9]{16}$/.test(releaseId),
                'Invalid evidence release'
            );
            manifestURL = localURL(pointer.manifest.path);
            expectedHash = pointer.manifest.sha256;
            invariant(
                manifestURL.pathname.endsWith(`/releases/${releaseId}/manifest.json`),
                'Pointer/release mismatch'
            );
        }
        const mr = await verifiedFetch(manifestURL, expectedHash, {
            signal,
            cache,
            max: 256 * 1024,
        });
        stale ||= mr.stale;
        const manifest = mr.value;
        invariant(
            manifest.schemaVersion === SCHEMA && manifest.releaseId === releaseId,
            'Incompatible release manifest'
        );
        const releaseBase = new URL('./', manifestURL),
            shard = manifest.shards?.[bucket];
        invariant(shard, 'Object is outside this evidence release');
        const sr = await verifiedFetch(localURL(shard.path, releaseBase), shard.sha256, {
            signal,
            cache,
            max: 256 * 1024,
            cacheFirst: true,
        });
        stale ||= sr.stale;
        invariant(
            sr.value.schemaVersion === SCHEMA && sr.value.releaseId === releaseId,
            'Mixed index release'
        );
        const asset = sr.value.entries?.[id];
        invariant(asset, 'No reviewed evidence packet is available for this entry');
        onProgress('Verifying the object and its sources…');
        const pr = await verifiedFetch(localURL(asset.path, releaseBase), asset.sha256, {
            signal,
            cache,
            cacheFirst: true,
        });
        stale ||= pr.stale;
        const envelope = pr.value;
        invariant(
            envelope.schemaVersion === SCHEMA &&
                envelope.releaseId === releaseId &&
                envelope.evidence.object.id === id,
            'Mixed object release or identity'
        );
        validatePacket(envelope.packet, envelope.evidence);
        const packetHash = envelope.packet.packetHash;
        invariant(
            (await sha256(stableJSON({ ...envelope.packet, packetHash: null }))) === packetHash,
            'Render packet hash mismatch'
        );
        signal.throwIfAborted();
        invariant(generation === this.generation, 'Stale object request');
        const result = {
            ...envelope,
            manifest,
            manifestHash: expectedHash || (await sha256(stableJSON(manifest) + '\n')),
            stale,
            releaseBase: releaseBase.href,
            source: 'verified_static_release',
        };
        this.context = freeze(result);
        return this.context;
    }
    async loadAlternative(id) {
        invariant(
            this.context?.evidence.alternativeAsset,
            'No alternative parameter sets were published'
        );
        const generation = this.generation,
            context = this.context,
            signal = this.controller.signal,
            asset = context.evidence.alternativeAsset,
            cache = await cacheOpen();
        const response = await verifiedFetch(
            localURL(asset.path, new URL(context.releaseBase)),
            asset.sha256,
            { signal, cache, max: 2 * 1024 * 1024, cacheFirst: true, encoding: 'gzip' }
        );
        invariant(
            response.value.releaseId === context.releaseId &&
                response.value.objectId === context.evidence.object.id,
            'Mixed alternative release'
        );
        invariant(
            Array.isArray(response.value.solutions) && response.value.solutions.length <= 512,
            'Invalid alternative set array'
        );
        const selected = response.value.solutions.find((s) => s.adoptedParameterSetId === id);
        invariant(selected, 'Unknown parameter solution');
        const parent = context.evidence,
            claimIds = new Set([
                ...(parent.object.existence.evidenceClaimIds || []),
                ...(parent.observations || []).map((o) => o.claimId),
                ...(parent.chemicalClaims || []).map((c) => c.claimId),
            ]);
        const extraClaims = parent.claims.filter((c) => claimIds.has(c.id)),
            extraCitationIds = new Set(extraClaims.flatMap((c) => c.citationIds));
        const e = {
            ...selected,
            object: { ...selected.object, existence: parent.object.existence },
            claims: [...selected.claims.filter((c) => !claimIds.has(c.id)), ...extraClaims],
            citations: [
                ...selected.citations.filter((c) => !extraCitationIds.has(c.id)),
                ...parent.citations.filter((c) => extraCitationIds.has(c.id)),
            ],
            observations: parent.observations || [],
            chemicalClaims: parent.chemicalClaims || [],
            spectralProducts: parent.spectralProducts || [],
            generatorHashes: parent.generatorHashes,
        };
        validateEvidence(e);
        signal.throwIfAborted();
        invariant(generation === this.generation, 'Stale parameter-set request');
        return freeze({
            ...context,
            evidence: e,
            packet: await compilePacket(e),
            stale: context.stale || response.stale,
        });
    }
}
