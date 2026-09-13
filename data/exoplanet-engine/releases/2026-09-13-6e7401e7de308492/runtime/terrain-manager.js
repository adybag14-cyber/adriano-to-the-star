/* global DOMException */
import { direction, projectFace, tileBounds, tileKey } from './terrain.js';
import { projectedError } from './physics.js';
/** Atomic frontier commits: matched edges and a shared transition clock. */
export class TerrainManager {
    constructor(T, scene, material, recipe, quality, onError) {
        this.T = T;
        this.scene = scene;
        this.material = material;
        this.recipe = recipe;
        this.quality = quality;
        this.onError = onError;
        this.tiles = new Map();
        this.pending = new Map();
        this.serial = 0;
        this.disposed = false;
        this.frame = 0;
        this.visible = [];
        this.previousSplits = new Set();
        this.roots = Array.from({ length: 6 }, (_, face) => ({ face, level: 0, x: 0, y: 0 }));
        this.worker = new Worker(new URL('./terrain-worker.js', import.meta.url), {
            type: 'module',
        });
        this.worker.postMessage({ type: 'recipe', version: recipe.id, recipe });
        this.worker.onmessage = (event) => this.receive(event.data);
        this.worker.onerror = (event) => {
            for (const p of this.pending.values()) p.reject(new Error(event.message));
            this.pending.clear();
            if (!this.disposed) onError(new Error('Terrain worker failed: ' + event.message));
        };
    }
    variantKey(tile, levels) {
        return `${tileKey(tile)}|${levels.join(',')}`;
    }
    async init() {
        this.visible = await Promise.all(this.roots.map((t) => this.request(t, [0, 0, 0, 0])));
        for (const e of this.visible) e.mesh.visible = true;
    }
    children(t) {
        return Array.from({ length: 4 }, (_, i) => ({
            face: t.face,
            level: t.level + 1,
            x: t.x * 2 + (i & 1),
            y: t.y * 2 + (i >> 1),
        }));
    }
    request(tile, levels) {
        const key = this.variantKey(tile, levels);
        if (this.tiles.has(key)) return Promise.resolve(this.tiles.get(key));
        if (this.pending.has(key)) return this.pending.get(key).promise;
        const id = ++this.serial;
        let resolve, reject;
        const promise = new Promise((a, b) => {
            resolve = a;
            reject = b;
        });
        this.pending.set(key, { id, key, promise, resolve, reject, tile });
        this.worker.postMessage({
            type: 'tile',
            id,
            version: this.recipe.id,
            tile,
            neighbourLevels: levels,
        });
        return promise;
    }
    receive(data) {
        if (this.disposed || data.version !== this.recipe.id) return;
        const pending = [...this.pending.values()].find((p) => p.id === data.id);
        if (!pending) return;
        this.pending.delete(pending.key);
        this.changed = true;
        if (data.type === 'error') {
            pending.reject(new Error(data.message));
            return;
        }
        const T = this.T,
            geometry = new T.BufferGeometry();
        geometry.setAttribute('position', new T.BufferAttribute(data.positions.slice(), 3));
        geometry.setAttribute('normal', new T.BufferAttribute(data.normals, 3));
        geometry.setAttribute('color', new T.BufferAttribute(data.colours, 3));
        geometry.setAttribute('planetDirection', new T.BufferAttribute(data.directions, 3));
        geometry.setAttribute('detailOrigin', new T.BufferAttribute(data.detailOrigins, 3));
        geometry.setAttribute('roughness', new T.BufferAttribute(data.roughness, 1));
        geometry.setIndex(new T.BufferAttribute(data.indices, 1));
        geometry.computeBoundingSphere();
        const mesh = new T.Mesh(geometry, this.material);
        mesh.visible = false;
        mesh.userData.feature = 'terrain';
        this.scene.add(mesh);
        const entry = {
            ...data,
            key: pending.key,
            mesh,
            lastUsed: this.frame,
            bytes:
                [
                    data.positions,
                    data.normals,
                    data.colours,
                    data.directions,
                    data.detailOrigins,
                    data.roughness,
                    data.indices,
                ].reduce((s, a) => s + a.byteLength, 0) + data.positions.byteLength,
        };
        this.tiles.set(entry.key, entry);
        pending.resolve(entry);
    }
    neighbours(tile, frontier) {
        const b = tileBounds(tile),
            eps = b.size * 1e-4;
        const points = [
            [b.u + b.size / 2, b.v - eps],
            [b.u + b.size + eps, b.v + b.size / 2],
            [b.u + b.size / 2, b.v + b.size + eps],
            [b.u - eps, b.v + b.size / 2],
        ];
        return points.map(([u, v]) => {
            const p = projectFace(direction(tile.face, u, v));
            return frontier.find((t) => {
                if (t.face !== p.face) return false;
                const a = tileBounds(t);
                return (
                    p.u >= a.u - 1e-12 &&
                    p.u <= a.u + a.size + 1e-12 &&
                    p.v >= a.v - 1e-12 &&
                    p.v <= a.v + a.size + 1e-12
                );
            });
        });
    }
    plan(camera, viewportHeight, fov) {
        let frontier = [...this.roots];
        const rejected = new Set();
        const scores = new Map();
        const score = (t) => {
            if (scores.has(t)) return scores.get(t);
            const b = tileBounds(t),
                n = direction(t.face, b.u + b.size / 2, b.v + b.size / 2),
                d = Math.hypot(...n.map((v, i) => v - camera[i]));
            if (t.level >= 20 || d > 3 + b.size) return 0;
            const error = projectedError(
                (b.size * b.size) / 256 +
                    Math.min(
                        this.recipe.reliefMetres / this.recipe.referenceRadiusMetres,
                        b.size * 0.008
                    ),
                viewportHeight,
                Math.max(d - b.size * 0.65, 0.00001),
                fov
            );
            const value =
                error /
                (this.quality.errorPixels * (this.previousSplits.has(tileKey(t)) ? 0.7 : 1));
            scores.set(t, value);
            return value;
        };
        // Split the highest projected error, including all prerequisite neighbour
        // splits. Reject the entire transaction when its balanced frontier exceeds
        // the quality budget; never leave a twenty-level jump beside a coarse edge.
        for (let iteration = 0; iteration < this.quality.maxTiles * 2; iteration++) {
            let candidate = null,
                highest = 1;
            for (const tile of frontier) {
                if (rejected.has(tileKey(tile))) continue;
                const value = score(tile);
                if (value > highest) {
                    candidate = tile;
                    highest = value;
                }
            }
            if (!candidate || score(candidate) <= 1 || frontier.length + 3 > this.quality.maxTiles)
                break;
            const trial = [...frontier];
            const split = (t) => {
                const index = trial.findIndex((v) => tileKey(v) === tileKey(t));
                if (index < 0) return;
                for (const neighbour of this.neighbours(t, trial))
                    if (neighbour && neighbour.level < t.level) split(neighbour);
                if (trial.length + 3 > this.quality.maxTiles) throw new Error('tile budget');
                const at = trial.findIndex((v) => tileKey(v) === tileKey(t));
                if (at >= 0) trial.splice(at, 1, ...this.children(t));
            };
            try {
                split(candidate);
                frontier = trial;
            } catch {
                rejected.add(tileKey(candidate));
            }
        }
        const splits = new Set();
        for (const t of frontier) {
            let p = t;
            while (p.level) {
                p = { face: p.face, level: p.level - 1, x: p.x >> 1, y: p.y >> 1 };
                splits.add(tileKey(p));
            }
        }
        this.previousSplits = splits;
        return frontier;
    }
    levels(tile, frontier) {
        return this.neighbours(tile, frontier).map((t) => t?.level ?? tile.level);
    }
    oldPosition(face, u, v, oldIndex) {
        let entry;
        for (const [level, tiles] of oldIndex[face]) {
            const width = 2 ** level;
            const x = Math.max(0, Math.min(width - 1, Math.floor(((u + 1) * width) / 2)));
            const y = Math.max(0, Math.min(width - 1, Math.floor(((v + 1) * width) / 2)));
            entry = tiles.get(`${x}/${y}`);
            if (entry) break;
        }
        if (!entry) return null;
        const b = tileBounds(entry.tile),
            gx = Math.max(0, Math.min(16, ((u - b.u) / b.size) * 16)),
            gy = Math.max(0, Math.min(16, ((v - b.v) / b.size) * 16)),
            x = Math.min(15, Math.floor(gx)),
            y = Math.min(15, Math.floor(gy)),
            fx = gx - x,
            fy = gy - y,
            a = y * 17 + x;
        const indices = fx + fy <= 1 ? [a, a + 1, a + 17] : [a + 18, a + 1, a + 17],
            weights = fx + fy <= 1 ? [1 - fx - fy, fx, fy] : [fx + fy - 1, 1 - fy, 1 - fx],
            positions = entry.mesh.geometry.getAttribute('position').array;
        return [0, 1, 2].map(
            (k) =>
                entry.anchor[k] +
                indices.reduce((sum, id, i) => sum + positions[id * 3 + k] * weights[i], 0)
        );
    }
    commit(entries, now) {
        const previous = this.visible;
        const previousKeys = new Set(previous.map((e) => e.key));
        const oldIndex = Array.from({ length: 6 }, () => new Map());
        for (const e of previous) {
            const face = oldIndex[e.tile.face];
            if (!face.has(e.tile.level)) face.set(e.tile.level, new Map());
            face.get(e.tile.level).set(`${e.tile.x}/${e.tile.y}`, e);
        }
        for (const e of this.tiles.values()) e.mesh.visible = false;
        // Every edge variant is ready before any mesh becomes visible. All positions
        // interpolate from the same previous frontier on the same clock.
        for (const e of entries) {
            e.mesh.visible = true;
            e.lastUsed = this.frame;
            // Unchanged patches already contain the exact endpoint geometry.
            // Avoid resampling their vertices or uploading identical buffers.
            if (previousKeys.has(e.key)) continue;
            const b = tileBounds(e.tile),
                start = new Float32Array(e.positions.length);
            for (let y = 0; y <= 16; y++)
                for (let x = 0; x <= 16; x++) {
                    const p = this.oldPosition(
                            e.tile.face,
                            b.u + (b.size * x) / 16,
                            b.v + (b.size * y) / 16,
                            oldIndex
                        ),
                        offset = (y * 17 + x) * 3;
                    for (let k = 0; k < 3; k++)
                        start[offset + k] = p ? p[k] - e.anchor[k] : e.positions[offset + k];
                }
            e.transition = { start, began: now };
            e.mesh.frustumCulled = false;
            e.mesh.geometry.getAttribute('position').array.set(start);
            e.mesh.geometry.getAttribute('position').needsUpdate = true;
        }
        this.visible = entries;
        this.transitionUntil = now + 260;
    }
    update(camera, viewportHeight, fov) {
        if (this.disposed) return;
        this.frame++;
        const now = performance.now();
        if (now < (this.transitionUntil || 0)) return;
        this.changed = false;
        const wanted = this.plan(camera, viewportHeight, fov),
            variants = wanted.map((t) => ({ tile: t, levels: this.levels(t, wanted) })),
            keys = new Set(variants.map((v) => this.variantKey(v.tile, v.levels)));
        this.needed = keys;
        for (const v of variants) {
            if (this.pending.size >= 8) break;
            const key = this.variantKey(v.tile, v.levels);
            if (!this.tiles.has(key))
                this.request(v.tile, v.levels).catch((error) => {
                    if (!this.disposed) this.onError(error);
                });
        }
        if (variants.every((v) => this.tiles.has(this.variantKey(v.tile, v.levels)))) {
            const entries = variants.map((v) => this.tiles.get(this.variantKey(v.tile, v.levels))),
                oldKeys = new Set(this.visible.map((e) => e.key));
            if (entries.length !== this.visible.length || entries.some((e) => !oldKeys.has(e.key)))
                this.commit(entries, now);
        }
        const cap = this.quality.maxTiles * 2 + 12;
        if (this.tiles.size > cap)
            for (const e of [...this.tiles.values()]
                .filter((e) => !e.mesh.visible && !keys.has(e.key))
                .sort((a, b) => a.lastUsed - b.lastUsed)) {
                this.scene.remove(e.mesh);
                e.mesh.geometry.dispose();
                this.tiles.delete(e.key);
                if (this.tiles.size <= cap) break;
            }
    }
    rebase(camera, now) {
        for (const e of this.visible) {
            e.mesh.position.set(...e.anchor.map((v, i) => v - camera[i]));
            if (e.transition) {
                const a = e.mesh.geometry.getAttribute('position'),
                    t = Math.min(1, Math.max(0, (now - e.transition.began) / 260)),
                    weight = t * t * (3 - 2 * t);
                for (let i = 0; i < a.array.length; i++)
                    a.array[i] =
                        e.transition.start[i] + (e.positions[i] - e.transition.start[i]) * weight;
                a.needsUpdate = true;
                if (t === 1) {
                    e.transition = null;
                    e.mesh.frustumCulled = true;
                }
            }
        }
    }
    diagnostics() {
        return {
            visibleTiles: this.visible.length,
            residentTiles: this.tiles.size,
            pendingTiles: this.pending.size,
            terrainBytes: [...this.tiles.values()].reduce(
                (s, e) => s + e.bytes + (e.transition?.start.byteLength || 0),
                0
            ),
            maximumLevel: Math.max(0, ...this.visible.map((e) => e.tile.level)),
            seamMethod: 'atomic neighbour-matched frontier; shared-clock geometry morph; no skirts',
            coordinateFrame:
                'CPU double-precision planet frame; tile anchors relative to the camera',
        };
    }
    dispose() {
        this.disposed = true;
        this.worker.terminate();
        for (const p of this.pending.values())
            p.reject(new DOMException('Terrain request cancelled', 'AbortError'));
        this.pending.clear();
        for (const e of this.tiles.values()) {
            this.scene.remove(e.mesh);
            e.mesh.geometry.dispose();
        }
        this.tiles.clear();
        this.visible = [];
    }
}
