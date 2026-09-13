import { SCHEMA, invariant, sha256, evidenceBase } from './contracts.js';
/** Resolve a complete versioned runtime before constructing a scene. */
export async function resolveViewer() {
    const base = evidenceBase(import.meta.url),
        requested = new URLSearchParams(location.search).get('evidence');
    const bootstrap = document.querySelector('script[data-evidence-engine="1"]');
    const pageRelease = bootstrap?.dataset.evidenceRelease;
    let cache = null;
    try {
        if (typeof caches !== 'undefined') cache = await caches.open('ita-exoplanet-evidence-v1');
    } catch {
        // Persistent storage is optional; verified network data can still be used.
    }
    const read = async (url, expected) => {
        let response;
        try {
            response = await fetch(url, {
                cache: 'no-cache',
                credentials: 'omit',
                signal: AbortSignal.timeout(10000),
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
        } catch (error) {
            response = await cache?.match(url);
            if (!response) throw error;
        }
        const bytes = new Uint8Array(await response.arrayBuffer());
        invariant(bytes.length <= 256000, 'Oversized release bootstrap');
        invariant(
            !expected || (await sha256(bytes)) === expected,
            'Runtime manifest hash mismatch'
        );
        const value = JSON.parse(new TextDecoder().decode(bytes));
        return { value, bytes };
    };
    let releaseId = requested || pageRelease,
        manifestURL,
        expected,
        pointerBytes = null;
    if (releaseId) {
        invariant(/^\d{4}-\d{2}-\d{2}-[a-f0-9]{16}$/.test(releaseId), 'Invalid saved release');
        manifestURL = new URL(`releases/${releaseId}/manifest.json`, base);
        if (!requested) expected = bootstrap.dataset.evidenceManifestSha256;
    } else {
        const { value: p, bytes } = await read(new URL('current.json', base));
        pointerBytes = bytes;
        invariant(p.schemaVersion === SCHEMA, 'Unsupported release pointer');
        releaseId = p.releaseId;
        manifestURL = new URL(p.manifest.path, base);
        expected = p.manifest.sha256;
    }
    invariant(
        manifestURL.origin === base.origin &&
            manifestURL.pathname === new URL(`releases/${releaseId}/manifest.json`, base).pathname,
        'Runtime release path mismatch'
    );
    const { value: manifest, bytes: manifestBytes } = await read(manifestURL, expected);
    invariant(
        manifest.releaseId === releaseId &&
            manifest.schemaVersion === SCHEMA &&
            manifest.runtime?.entry,
        'This evidence release does not include a compatible versioned viewer'
    );
    const url = new URL(manifest.runtime.entry, new URL('./', manifestURL));
    invariant(
        url.origin === base.origin && url.pathname.startsWith(new URL('./', manifestURL).pathname),
        'Runtime entry escaped its release'
    );
    const module = await import(url.href);
    if (cache) {
        await cache.put(manifestURL, new Response(manifestBytes));
        if (pointerBytes)
            await cache.put(new URL('current.json', base), new Response(pointerBytes));
    }
    return class PinnedReconstructionViewer extends module.ReconstructionViewer {
        loadObject(id, options = {}) {
            return super.loadObject(id, {
                releaseId,
                allowCompatibleFallback: !requested,
                ...options,
            });
        }
    };
}
