(() => {
    const source = new URL(document.currentScript.src);
    const queue = [],
        pending = new Map(),
        cache = new Map();
    let worker,
        busy = false,
        nextId = 0,
        model;
    const apply = (node, url, profile) => {
        if (!node.isConnected) return;
        const image = document.createElement('img');
        image.src = url;
        image.alt = `${profile.planetName}: model illustration, not a mapped surface`;
        image.width = image.height = 144;
        image.decoding = 'async';
        image.className = 'spectrum-planet-preview';
        node.append(image);
        node.dataset.previewKind = 'spectrum-linked';
        node.dataset.modelVersion = profile.modelVersion;
        node.setAttribute(
            'aria-label',
            `${profile.planetName}: Education appearance model; planetary spectrum metadata available; geography is hypothetical`
        );
        const label = document.createElement('span');
        label.className = 'planet-preview-label';
        label.textContent = 'Model · spectrum linked';
        node.append(label);
    };
    const pump = () => {
        if (busy || !worker) return;
        while (queue.length && !queue[0].node.isConnected) queue.shift();
        const entry = queue.shift();
        if (!entry) return;
        busy = true;
        const id = ++nextId;
        pending.set(id, entry);
        worker.postMessage({
            id,
            model: entry.profile,
            size: Math.min(512, Math.ceil(144 * Math.max(1, devicePixelRatio || 1))),
        });
    };
    const observe = new IntersectionObserver(
        (entries) => {
            for (const entry of entries) {
                if (!entry.isIntersecting) continue;
                observe.unobserve(entry.target);
                const node = entry.target,
                    name = node.dataset.previewTarget || node.closest('[data-name]')?.dataset.name;
                const profile = model?.derive(name);
                if (!profile || !(profile.evidence.spectraCount > 0)) {
                    node.dataset.previewKind = 'generic';
                    node.setAttribute(
                        'aria-label',
                        `${name || 'Exoplanet'}: generic illustrative placeholder; no planetary atmospheric spectrum in this snapshot`
                    );
                    continue;
                }
                const key = `${profile.planetId}:${profile.seed}`;
                if (cache.has(key)) apply(node, cache.get(key), profile);
                else {
                    queue.push({ node, profile, key });
                    pump();
                }
            }
        },
        { rootMargin: '160px' }
    );
    const scan = (root) => {
        const nodes = root.matches?.('.ita-planet-visual,.atmosphere-model-preview')
            ? [root]
            : root.querySelectorAll?.('.ita-planet-visual,.atmosphere-model-preview') || [];
        for (const node of nodes) {
            if (node.dataset.previewObserved) continue;
            node.dataset.previewObserved = 'true';
            observe.observe(node);
        }
    };
    const boot = async () => {
        try {
            const catalog = await window.ExoplanetAtmosphereCatalog.ensureCatalog();
            model =
                window.__planetaryAppearanceModel || new window.PlanetaryAppearanceModel(catalog);
            if (typeof Worker !== 'function' || typeof OffscreenCanvas !== 'function') return;
            const url = new URL('planet-preview-worker.js', source);
            url.search = source.search;
            worker = new Worker(url);
            worker.onmessage = ({ data }) => {
                const entry = pending.get(data.id);
                pending.delete(data.id);
                busy = false;
                if (entry && data.blob) {
                    let url = cache.get(entry.key);
                    if (!url) {
                        url = URL.createObjectURL(data.blob);
                        cache.set(entry.key, url);
                    }
                    apply(entry.node, url, entry.profile);
                }
                pump();
            };
            worker.onerror = () => {
                worker.terminate();
                worker = null;
                pending.clear();
                queue.length = 0;
            };
            const root = document.getElementById('main-content') || document.querySelector('main');
            new MutationObserver((records) => {
                for (const record of records)
                    for (const node of record.addedNodes) if (node.nodeType === 1) scan(node);
            }).observe(root, { childList: true, subtree: true });
            scan(root);
        } catch (error) {
            console.warn(
                'Planet previews unavailable; generic illustrations retained:',
                error.message
            );
        }
    };
    if (document.readyState === 'loading')
        document.addEventListener('DOMContentLoaded', boot, { once: true });
    else boot();
})();
