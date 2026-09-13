import { invariant, sha256, evidenceBase } from './contracts.js';
import { planck } from './physics.js';
export const OBSERVER = {
    id: 'CIE-1931-2deg-1nm-2019',
    doi: '10.25039/CIE.DS.xvudnb9b',
    license: 'CC BY-SA 4.0',
    sha256: 'fa663e3535a7e0763a745993a1f0a192eb0275ac46ad2d1befd7626841e713c1',
    wavelengthUnit: 'nm',
    range: [360, 830],
};
let observerPromise = null;
export async function loadObserver(signal) {
    if (!observerPromise)
        observerPromise = (async () => {
            const response = await fetch(
                new URL(`assets/${OBSERVER.sha256}.csv`, evidenceBase(import.meta.url)),
                { signal, credentials: 'omit' }
            );
            invariant(response.ok, 'CIE observer asset unavailable');
            const raw = new Uint8Array(await response.arrayBuffer());
            invariant((await sha256(raw)) === OBSERVER.sha256, 'CIE observer hash mismatch');
            const rows = new TextDecoder()
                .decode(raw)
                .trim()
                .split(/\r?\n/)
                .map((line) => line.split(',').map(Number));
            invariant(
                rows.length === 471 &&
                    rows.every(
                        (r, i) => r.length === 4 && r[0] === 360 + i && r.every(Number.isFinite)
                    ),
                'Invalid observer grid'
            );
            return rows;
        })().catch((error) => {
            observerPromise = null;
            throw error;
        });
    return observerPromise;
}
/** Trapezoidal integration. L is spectral radiance per metre; K is explicit. */
export function integrateXYZ(rows, radiance, { K = 1, stride = 1 } = {}) {
    invariant(
        Number.isFinite(K) && K >= 0 && Number.isInteger(stride) && stride >= 1,
        'Invalid radiometric normalization'
    );
    const xyz = [0, 0, 0];
    for (let i = 0; i < rows.length - 1; i += stride) {
        const a = rows[i],
            b = rows[Math.min(i + stride, rows.length - 1)],
            la = radiance(a[0] * 1e-9),
            lb = radiance(b[0] * 1e-9);
        invariant(
            Number.isFinite(la) && la >= 0 && Number.isFinite(lb) && lb >= 0,
            'Invalid spectral radiance'
        );
        const step = (b[0] - a[0]) * 1e-9;
        for (let j = 0; j < 3; j++) xyz[j] += K * step * 0.5 * (la * a[j + 1] + lb * b[j + 1]);
    }
    return xyz;
}
export function xyzToLinearSRGB([x, y, z]) {
    return [
        3.2406 * x - 1.5372 * y - 0.4986 * z,
        -0.9689 * x + 1.8758 * y + 0.0415 * z,
        0.0557 * x - 0.204 * y + 1.057 * z,
    ];
}
export const encodeSRGB = (v) => (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055);
export function displayRGB(xyz, { exposure = 1 } = {}) {
    invariant(Number.isFinite(exposure) && exposure >= 0, 'Invalid exposure');
    // Fixed hue-preserving scale after negative-channel clipping, then sRGB encoding.
    const linear = xyzToLinearSRGB(xyz).map((v) => Math.max(0, v * exposure)),
        largest = Math.max(...linear, 1);
    return linear.map((v) => encodeSRGB(v / largest));
}
export function stellarColour(rows, temperature) {
    invariant(
        temperature >= 2000 && temperature <= 50000,
        'Stellar spectral approximation outside domain'
    );
    const xyz = integrateXYZ(rows, (w) => planck(w, temperature)),
        rgb = xyzToLinearSRGB(xyz),
        maxValue = Math.max(...rgb);
    return {
        linearRGB: rgb.map((v) => Math.max(0, v / maxValue)),
        rawXYZ: xyz,
        normalization: 1 / maxValue,
        label: `${temperature.toFixed(0)} K stellar blackbody approximation; exposure normalized once for the scene; no white adaptation`,
        observer: OBSERVER.id,
    };
}
export function albedoMaterial(rows, temperature, model) {
    const source = xyzToLinearSRGB(integrateXYZ(rows, (w) => planck(w, temperature)));
    const radiance = integrateXYZ(rows, (w) => {
        const nm = w * 1e9,
            b = model.bands.find((b) => nm >= b.lower && nm <= b.upper);
        const albedo = b
            ? b.constraint.kind === 'estimate'
                ? b.constraint.value
                : b.constraint.kind === 'upper_limit'
                  ? b.constraint.value * 0.5
                  : model.outsideBandAlbedo
            : model.outsideBandAlbedo;
        return planck(w, temperature) * Math.min(1, Math.max(0, albedo * 1.5));
    });
    const reflected = xyzToLinearSRGB(radiance);
    return {
        linearRGB: reflected.map((v, i) => Math.max(0, Math.min(1, v / source[i]))),
        rawXYZ: radiance,
        assumptions:
            'Lambertian geometric-albedo conversion; conditional band interpolation and unobserved wavelengths; negative RGB channels clipped.',
    };
}
export function bandRadiance(temperature, lowerMicrometres = 8, upperMicrometres = 14, steps = 48) {
    invariant(
        temperature > 0 && lowerMicrometres > 0 && upperMicrometres > lowerMicrometres,
        'Invalid thermal band'
    );
    let sum = 0;
    const step = ((upperMicrometres - lowerMicrometres) / steps) * 1e-6;
    for (let i = 0; i <= steps; i++) {
        const w = lowerMicrometres * 1e-6 + i * step;
        sum += planck(w, temperature) * (i === 0 || i === steps ? 0.5 : 1) * step;
    }
    return sum;
}
