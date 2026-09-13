/** Continuous double-precision planet-fixed fields shared by geometry and picking. */
import { invariant } from './contracts.js';
const mix = (a, b, t) => a + (b - a) * t,
    clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const smooth = (x) => x * x * x * (x * (x * 6 - 15) + 10);
export const normalize = (v) => {
    const l = Math.hypot(...v);
    return v.map((x) => x / l);
};
export const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
export const cross = (a, b) => [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
];
export const FACES = Object.freeze([
    [
        [1, 0, 0],
        [0, 0, -1],
        [0, 1, 0],
    ],
    [
        [-1, 0, 0],
        [0, 0, 1],
        [0, 1, 0],
    ],
    [
        [0, 1, 0],
        [1, 0, 0],
        [0, 0, -1],
    ],
    [
        [0, -1, 0],
        [1, 0, 0],
        [0, 0, 1],
    ],
    [
        [0, 0, 1],
        [1, 0, 0],
        [0, 1, 0],
    ],
    [
        [0, 0, -1],
        [-1, 0, 0],
        [0, 1, 0],
    ],
]);
export function direction(face, u, v) {
    const [n, a, b] = FACES[face];
    return normalize(n.map((x, i) => x + a[i] * u + b[i] * v));
}
export function projectFace(p) {
    const a = p.map(Math.abs),
        axis = a.indexOf(Math.max(...a)),
        face = axis === 0 ? (p[0] > 0 ? 0 : 1) : axis === 1 ? (p[1] > 0 ? 2 : 3) : p[2] > 0 ? 4 : 5,
        [n, u, v] = FACES[face],
        scale = dot(p, n);
    return { face, u: dot(p, u) / scale, v: dot(p, v) / scale };
}
function lattice(x, y, z, seed) {
    let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 2147483647) ^ seed;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}
const craterCache = new Map();
export function craterCatalogue(seed) {
    if (craterCache.has(seed)) return craterCache.get(seed);
    const craters = Array.from({ length: 18 }, (_, i) => ({
        center: normalize([
            lattice(i, 3, 7, seed) * 2 - 1,
            lattice(i, 11, 5, seed) * 2 - 1,
            lattice(i, 17, 13, seed) * 2 - 1,
        ]),
        radius: 0.025 + lattice(i, 41, 17, seed) * 0.12,
    }));
    craterCache.set(seed, craters);
    if (craterCache.size > 16) craterCache.delete(craterCache.keys().next().value);
    return craters;
}
export function noise(x, y, z, seed) {
    const ix = Math.floor(x),
        iy = Math.floor(y),
        iz = Math.floor(z),
        fx = smooth(x - ix),
        fy = smooth(y - iy),
        fz = smooth(z - iz);
    return mix(
        mix(
            mix(lattice(ix, iy, iz, seed), lattice(ix + 1, iy, iz, seed), fx),
            mix(lattice(ix, iy + 1, iz, seed), lattice(ix + 1, iy + 1, iz, seed), fx),
            fy
        ),
        mix(
            mix(lattice(ix, iy, iz + 1, seed), lattice(ix + 1, iy, iz + 1, seed), fx),
            mix(lattice(ix, iy + 1, iz + 1, seed), lattice(ix + 1, iy + 1, iz + 1, seed), fx),
            fy
        ),
        fz
    );
}
export function fbm(p, seed, octaves = 6) {
    let value = 0,
        weight = 0.5,
        scale = 1;
    for (let i = 0; i < octaves; i++) {
        value +=
            weight *
            noise(p[0] * scale + 13.1, p[1] * scale + 7.7, p[2] * scale + 3.2, seed + i * 37);
        scale *= 2.03;
        weight *= 0.5;
    }
    return value;
}
export function terrainField(n, recipe) {
    if (!recipe.solidSurface)
        return {
            height: 0,
            roughness: 0.95,
            colour: [0.35, 0.3, 0.23],
            material: 'opaque gas reference layer',
        };
    const seed = recipe.seedInt,
        macro = fbm(
            n.map((x) => x * 3.8),
            seed,
            5
        ),
        regional = fbm(
            n.map((x) => x * 19),
            seed + 192,
            4
        ),
        ridge = 1 - Math.abs(noise(...n.map((x) => x * 37), seed + 97) * 2 - 1);
    let h = (macro - 0.48) * 0.9 + ridge ** 3 * 0.12 + regional * 0.04;
    let colour = [0.09, 0.085, 0.08],
        roughness = 0.88;
    switch (recipe.family) {
        case 'airless-rocky':
        case 'scorched-rocky': {
            // Overlapping spherical impact basins; all centres derive from the geological seed.
            for (const { center, radius } of craterCatalogue(seed)) {
                const d = Math.sqrt(Math.max(0, 2 * (1 - dot(n, center)))) / radius;
                if (d < 1.25)
                    h += -0.07 * (1 - clamp(d)) ** 2 + 0.025 * Math.exp(-(((d - 0.97) / 0.1) ** 2));
            }
            const a = 0.11 + macro * 0.14;
            colour =
                recipe.family === 'scorched-rocky'
                    ? [a * 0.8, a * 0.63, a * 0.5]
                    : [a, a * 0.94, a * 0.88];
            break;
        }
        case 'icy': {
            const fracture = Math.abs(Math.sin(n[0] * 81 + n[2] * 32 + regional * 15));
            h = (macro - 0.5) * 0.6 - fracture ** 14 * 0.065;
            colour = [0.53 + macro * 0.17, 0.61 + macro * 0.16, 0.66 + macro * 0.15];
            roughness = 0.62;
            break;
        }
        case 'lava': {
            h = (macro - 0.49) * 0.65 + ridge ** 4 * 0.12;
            colour = [0.025 + regional * 0.08, 0.021 + regional * 0.055, 0.018 + regional * 0.035];
            roughness = 0.9;
            break;
        }
        case 'ocean': {
            h = (macro - 0.55) * 1.5 + ridge ** 3 * 0.12;
            colour = [0.19 + regional * 0.06, 0.16 + regional * 0.055, 0.12 + regional * 0.04];
            break;
        }
        case 'temperate-rocky': {
            h = (macro - 0.46) * 1.25 + ridge ** 3 * 0.18;
            colour = [0.2 + regional * 0.1, 0.16 + regional * 0.08, 0.12 + regional * 0.06];
            break;
        }
        default:
            break;
    }
    const metres = n.map((v) => v * recipe.referenceRadiusMetres);
    let localRelief = 0;
    for (const [scale, amplitude] of [
        [64000, 500],
        [8000, 90],
        [1000, 16],
        [128, 2.5],
        [16, 0.25],
    ])
        localRelief += (noise(...metres.map((v) => v / scale), seed + scale) - 0.5) * amplitude;
    return {
        height: h * recipe.reliefMetres + localRelief * Math.min(1, recipe.reliefMetres / 8000),
        roughness,
        colour,
        material: recipe.material,
    };
}
export function physicalPosition(n, recipe) {
    const h = terrainField(n, recipe).height;
    return n.map((x) => x * (1 + h / recipe.referenceRadiusMetres));
}
export function surfaceNormal(n, recipe, filterMetres = 16) {
    const tangent = normalize(cross(Math.abs(n[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0], n)),
        bitangent = cross(n, tangent),
        eps = Math.max(1e-9, Math.min(0.002, filterMetres / recipe.referenceRadiusMetres));
    const h = terrainField(n, recipe).height / recipe.referenceRadiusMetres,
        nt = normalize(n.map((x, i) => x + tangent[i] * eps)),
        nb = normalize(n.map((x, i) => x + bitangent[i] * eps));
    const dt = (terrainField(nt, recipe).height / recipe.referenceRadiusMetres - h) / eps,
        db = (terrainField(nb, recipe).height / recipe.referenceRadiusMetres - h) / eps;
    return normalize(n.map((x, i) => x - tangent[i] * dt - bitangent[i] * db));
}
export function tileKey(tile) {
    return `${tile.face}/${tile.level}/${tile.x}/${tile.y}`;
}
export function tileBounds(tile) {
    const size = 2 / 2 ** tile.level;
    return { u: -1 + tile.x * size, v: -1 + tile.y * size, size };
}
/** Geometry uses local anchors; GPU positions never contain system-scale coordinates. */
export function generateTile(
    tile,
    recipe,
    neighbourLevels = [tile.level, tile.level, tile.level, tile.level],
    segments = 16
) {
    invariant(
        tile.face >= 0 &&
            tile.face < 6 &&
            Number.isInteger(tile.level) &&
            tile.level >= 0 &&
            tile.level <= 22,
        'Invalid terrain address'
    );
    const { u, v, size } = tileBounds(tile),
        anchor = physicalPosition(direction(tile.face, u + size / 2, v + size / 2), recipe),
        positions = [],
        normals = [],
        colours = [],
        directions = [],
        detailOrigins = [],
        indices = [],
        roughness = [];
    const sample = (x, y) => {
        const n = direction(tile.face, u + (size * x) / segments, v + (size * y) / segments),
            field = terrainField(n, recipe);
        return {
            p: physicalPosition(n, recipe),
            normal: surfaceNormal(
                n,
                recipe,
                Math.max(16, (size * recipe.referenceRadiusMetres) / segments)
            ),
            colour: field.colour,
            roughness: field.roughness,
            n,
        };
    };
    const memo = new Map(),
        get = (x, y) => {
            const key = `${x}/${y}`;
            if (!memo.has(key)) memo.set(key, sample(x, y));
            return memo.get(key);
        };
    for (let y = 0; y <= segments; y++)
        for (let x = 0; x <= segments; x++) {
            let s = get(x, y);
            const edge = y === 0 ? 0 : x === segments ? 1 : y === segments ? 2 : x === 0 ? 3 : -1;
            if (edge >= 0 && neighbourLevels[edge] < tile.level) {
                const step = Math.min(segments, 2 ** (tile.level - neighbourLevels[edge])),
                    index = edge % 2 === 0 ? x : y,
                    a = Math.floor(index / step) * step,
                    b = Math.min(segments, a + step),
                    t = (index - a) / step;
                if (t !== 0) {
                    const sa = get(edge % 2 === 0 ? a : x, edge % 2 === 0 ? y : a),
                        sb = get(edge % 2 === 0 ? b : x, edge % 2 === 0 ? y : b);
                    s = {
                        ...s,
                        p: sa.p.map((v, i) => mix(v, sb.p[i], t)),
                        normal: normalize(sa.normal.map((v, i) => mix(v, sb.normal[i], t))),
                        colour: sa.colour.map((v, i) => mix(v, sb.colour[i], t)),
                    };
                }
            }
            positions.push(...s.p.map((p, i) => p - anchor[i]));
            normals.push(...s.normal);
            colours.push(...s.colour);
            directions.push(...s.n);
            detailOrigins.push(
                ...anchor.map((v) => (((v * recipe.referenceRadiusMetres) % 8192) + 8192) % 8192)
            );
            roughness.push(s.roughness);
        }
    for (let y = 0; y < segments; y++)
        for (let x = 0; x < segments; x++) {
            const a = y * (segments + 1) + x,
                b = a + 1,
                c = a + segments + 1,
                d = c + 1;
            indices.push(a, b, c, b, d, c);
        }
    // The chosen face bases are outward-handed. Check rather than relying on a visual skirt.
    const a = positions.slice(0, 3),
        b = positions.slice(3, 6),
        c = positions.slice((segments + 1) * 3, (segments + 2) * 3),
        normal = cross(
            b.map((n, i) => n - a[i]),
            c.map((n, i) => n - a[i])
        );
    if (dot(normal, anchor) < 0)
        for (let i = 0; i < indices.length; i += 3)
            [indices[i + 1], indices[i + 2]] = [indices[i + 2], indices[i + 1]];
    return {
        key: tileKey(tile),
        tile,
        anchor,
        positions: new Float32Array(positions),
        normals: new Float32Array(normals),
        colours: new Float32Array(colours),
        directions: new Float32Array(directions),
        detailOrigins: new Float32Array(detailOrigins),
        roughness: new Float32Array(roughness),
        indices: new Uint16Array(indices),
        neighbourLevels,
    };
}
export function pickSurface(origin, ray, recipe) {
    const outer = 1 + recipe.reliefMetres / recipe.referenceRadiusMetres,
        b = dot(origin, ray),
        c = dot(origin, origin) - outer ** 2,
        disc = b * b - c;
    if (disc < 0) return null;
    let lo = Math.max(0, -b - Math.sqrt(disc)),
        hi = -b + Math.sqrt(disc);
    if (hi < 0) return null;
    const residual = (t) => {
        const p = origin.map((v, i) => v + ray[i] * t),
            r = Math.hypot(...p),
            h = terrainField(
                p.map((v) => v / r),
                recipe
            ).height;
        return r - (1 + (recipe.liquid ? Math.max(0, h) : h) / recipe.referenceRadiusMetres);
    };
    let previous = lo;
    const maxDistance = Math.min(hi - lo, outer * 2);
    for (let i = 1; i <= 128; i++) {
        const t = lo + (maxDistance * i) / 128;
        if (residual(t) <= 0) {
            lo = previous;
            hi = t;
            for (let n = 0; n < 40; n++) {
                const mid = (lo + hi) / 2;
                if (residual(mid) > 0) lo = mid;
                else hi = mid;
            }
            return origin.map((v, j) => v + ray[j] * hi);
        }
        previous = t;
    }
    return null;
}
