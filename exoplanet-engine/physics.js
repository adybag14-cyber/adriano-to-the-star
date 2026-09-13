import { adopted, central, invariant } from './contracts.js';
// SI exact definitions, IAU 2015 nominal conversion constants and CODATA 2018 G.
export const C = Object.freeze({
    version: 'SI-2019_IAU-2015_CODATA-2018',
    G: 6.6743e-11,
    k: 1.380649e-23,
    h: 6.62607015e-34,
    c: 299792458,
    atomicMass: 1.6605390666e-27,
    sigma: 5.670374419e-8,
    earthRadius: 6378100,
    earthMass: 3.986004e14 / 6.6743e-11,
    sunRadius: 6.957e8,
    sunMass: 1.3271244e20 / 6.6743e-11,
    sunLuminosity: 3.828e26,
    au: 149597870700,
    parsec: 3.085677581491367e16,
    day: 86400,
});
const positive = (...v) => v.every((x) => Number.isFinite(x) && x > 0);
export const density = (m, r) => (positive(m, r) ? (3 * m) / (4 * Math.PI * r ** 3) : null);
export const gravity = (m, r) => (positive(m, r) ? (C.G * m) / r ** 2 : null);
export const irradiance = (l, r) => (positive(l, r) ? l / (4 * Math.PI * r ** 2) : null);
export const semiMajorAxis = (starMass, planetMass, period) =>
    positive(starMass, period) && Number.isFinite(planetMass) && planetMass >= 0
        ? Math.cbrt((C.G * (starMass + planetMass) * period ** 2) / (4 * Math.PI ** 2))
        : null;
export const luminosity = (radius, temperature) =>
    positive(radius, temperature) ? 4 * Math.PI * radius ** 2 * C.sigma * temperature ** 4 : null;
export const equilibriumTemperature = (l, r, albedo) =>
    positive(l, r) && Number.isFinite(albedo) && albedo >= 0 && albedo < 1
        ? (((1 - albedo) * l) / (16 * Math.PI * C.sigma * r ** 2)) ** 0.25
        : null;
export const scaleHeight = (temperature, mu, g) =>
    positive(temperature, mu, g) ? (C.k * temperature) / (mu * C.atomicMass * g) : null;
export function reportedBounds(q) {
    if (q?.state !== 'known') return null;
    const c = q.constraint;
    if (c.kind === 'interval') return [c.lower, c.upper];
    if (c.kind !== 'estimate') return null;
    if (c.errorMinus === null || c.errorPlus === null) return null;
    return [c.value - c.errorMinus, c.value + c.errorPlus];
}
/** Conservative endpoint envelope, not a posterior or confidence interval. */
export function propagateEnvelope(fn, inputs) {
    const center = fn(...inputs.map(central));
    if (!Number.isFinite(center) || center <= 0) return null;
    const bounds = inputs.map(reportedBounds);
    if (bounds.some((b) => !b || b[0] <= 0))
        return {
            kind: 'estimate',
            value: center,
            errorMinus: null,
            errorPlus: null,
            uncertainty: null,
        };
    const values = [];
    for (let mask = 0; mask < 2 ** bounds.length; mask++) {
        const value = fn(...bounds.map((b, i) => b[(mask >> i) & 1]));
        if (!Number.isFinite(value) || value <= 0) return null;
        values.push(value);
    }
    return {
        kind: 'estimate',
        value: center,
        errorMinus: Math.max(0, center - Math.min(...values)),
        errorPlus: Math.max(0, Math.max(...values) - center),
        uncertainty: {
            interpretation: 'propagated_reported_bounds',
            level: null,
            covarianceId: null,
            distributionAssetId: null,
            assumptions: [
                'Endpoint envelope over the reported marginal bounds; dependence is not measured. This is not a joint confidence interval.',
            ],
        },
    };
}
export function deriveBulk(e) {
    const mass = adopted(e, 'mass'),
        radius = adopted(e, 'radius');
    if (
        central(mass) === null ||
        central(radius) === null ||
        mass.definition !== 'true planet mass'
    )
        return [];
    if (mass.parameterSetId !== radius.parameterSetId) return [];
    return [
        ['density', 'kg m-3', density, 'spherical bulk density'],
        ['gravity', 'm s-2', gravity, 'spherical gravitational acceleration at adopted radius'],
    ]
        .map(([key, unit, fn, definition]) => ({
            key,
            unit,
            definition,
            constraint: propagateEnvelope(fn, [mass, radius]),
            inputs: [mass.id, radius.id],
        }))
        .filter((x) => x.constraint);
}
export function derivePhysical(e) {
    const output = deriveBulk(e),
        hostRadius = adopted(e, 'hostRadius'),
        hostTemperature = adopted(e, 'hostTemperature'),
        hostLuminosity = adopted(e, 'hostLuminosity'),
        orbit = adopted(e, 'semiMajorAxis');
    const compatible = (values) =>
        values.every((q) => central(q) !== null && q.parameterSetId === e.adoptedParameterSetId);
    let light = hostLuminosity;
    if (central(light) === null && compatible([hostRadius, hostTemperature])) {
        const constraint = propagateEnvelope(luminosity, [hostRadius, hostTemperature]);
        if (constraint) {
            const key = 'hostLuminosity',
                id = `${e.adoptedParameterSetId}:derived-${key}`;
            output.push({
                id,
                key,
                unit: 'W',
                definition: 'bolometric luminosity from effective temperature and stellar radius',
                constraint,
                inputs: [hostRadius.id, hostTemperature.id],
            });
            light = {
                id,
                key,
                state: 'known',
                constraint,
                parameterSetId: e.adoptedParameterSetId,
            };
        }
    }
    if (compatible([light, orbit])) {
        const constraint = propagateEnvelope(irradiance, [light, orbit]);
        if (constraint)
            output.push({
                key: 'irradiance',
                unit: 'W m-2',
                definition:
                    'irradiance from the adopted host at the semi-major-axis reference separation; not an instantaneous ephemeris',
                constraint,
                inputs: [light.id, orbit.id],
            });
    }
    const starMass = adopted(e, 'hostMass'),
        planetMass = adopted(e, 'mass'),
        period = adopted(e, 'orbitalPeriod');
    if (
        central(orbit) === null &&
        planetMass?.definition === 'true planet mass' &&
        compatible([starMass, planetMass, period])
    ) {
        const constraint = propagateEnvelope(semiMajorAxis, [starMass, planetMass, period]);
        if (constraint)
            output.push({
                id: `${e.adoptedParameterSetId}:derived-semiMajorAxis`,
                key: 'semiMajorAxis',
                unit: 'm',
                definition: 'semi-major axis under the named two-body Keplerian approximation',
                constraint,
                inputs: [starMass.id, planetMass.id, period.id],
            });
    }
    return output;
}
export function planck(wavelengthMetres, temperature) {
    if (!positive(wavelengthMetres, temperature)) return 0;
    const exponent = (C.h * C.c) / (wavelengthMetres * C.k * temperature);
    if (exponent > 700) return 0;
    return (2 * C.h * C.c ** 2) / (wavelengthMetres ** 5 * Math.expm1(exponent));
}
export function hydrostaticProfile({ temperature, mu, gravity: g, pressure, radius }) {
    invariant(
        positive(temperature, mu, g, radius) && Number.isFinite(pressure) && pressure >= 0,
        'Invalid atmospheric domain'
    );
    invariant(
        temperature >= 30 && temperature <= 3000 && mu >= 2 && mu <= 100 && pressure <= 1e6,
        'Atmospheric model domain unsupported'
    );
    if (pressure === 0) return { height: 0, top: 0, density0: 0, scaleHeight: 0 };
    const height = scaleHeight(temperature, mu, g);
    invariant(
        height / radius < 0.025,
        'Extended atmosphere exceeds the admitted bound-atmosphere domain'
    );
    return {
        height,
        scaleHeight: height,
        top: height * 12,
        density0: (pressure * mu * C.atomicMass) / (C.k * temperature),
        radialGravity: true,
        escapeParameter: radius / height,
    };
}
/** Ideal dilute-gas Rayleigh cross section, King factor explicitly provided. */
export function rayleighCrossSection(
    wavelengthMetres,
    refractiveIndex,
    numberDensity,
    kingFactor = 1
) {
    invariant(
        positive(wavelengthMetres, numberDensity, kingFactor) && refractiveIndex >= 1,
        'Invalid Rayleigh inputs'
    );
    return (
        ((24 * Math.PI ** 3) / (numberDensity ** 2 * wavelengthMetres ** 4)) *
        ((refractiveIndex ** 2 - 1) / (refractiveIndex ** 2 + 2)) ** 2 *
        kingFactor
    );
}
export function projectedError(geometricError, viewportHeight, distance, fovRadians) {
    if (!positive(geometricError, viewportHeight, fovRadians) || fovRadians >= Math.PI)
        return Infinity;
    return (
        (geometricError * viewportHeight) /
        (2 * Math.max(distance, 1e-9) * Math.tan(fovRadians / 2))
    );
}
