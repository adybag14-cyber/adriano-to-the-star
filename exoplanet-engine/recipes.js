import {
    GENERATOR,
    POLICY,
    adopted,
    central,
    invariant,
    sha256,
    stableJSON,
    freeze,
} from './contracts.js';
import { C, equilibriumTemperature, luminosity, hydrostaticProfile } from './physics.js';
const families = Object.freeze([
    {
        id: 'airless-rocky',
        label: 'Airless rocky hypothesis',
        solid: true,
        pressure: 0,
        mu: 28,
        temperature: 350,
        material: 'basalt',
        liquid: null,
        relief: 8000,
    },
    {
        id: 'scorched-rocky',
        label: 'Irradiated rocky hypothesis',
        solid: true,
        pressure: 0,
        mu: 28,
        temperature: 1000,
        material: 'scorched rock',
        liquid: null,
        relief: 4500,
    },
    {
        id: 'lava',
        label: 'Lava-dominated hypothesis',
        solid: true,
        pressure: 0,
        mu: 40,
        temperature: 1800,
        material: 'basalt and molten silicate',
        liquid: 'molten silicate',
        relief: 3000,
    },
    {
        id: 'temperate-rocky',
        label: 'Temperate rocky hypothesis',
        solid: true,
        pressure: 100000,
        mu: 28,
        temperature: 285,
        material: 'rock and sediment',
        liquid: null,
        relief: 9000,
    },
    {
        id: 'icy',
        label: 'Icy-world hypothesis',
        solid: true,
        pressure: 0,
        mu: 28,
        temperature: 140,
        material: 'fractured water ice',
        liquid: null,
        relief: 5000,
    },
    {
        id: 'ocean',
        label: 'Ocean-dominated hypothesis',
        solid: true,
        pressure: 120000,
        mu: 28,
        temperature: 285,
        material: 'rock and assumed water',
        liquid: 'liquid water',
        relief: 10000,
    },
    {
        id: 'volatile-rich',
        label: 'Volatile-rich / sub-Neptune hypothesis',
        solid: false,
        pressure: 100000,
        mu: 2.3,
        temperature: 550,
        material: 'hydrogen-rich opaque reference layer',
        liquid: null,
        relief: 0,
    },
    {
        id: 'hot-gas',
        label: 'Hot gas-giant hypothesis',
        solid: false,
        pressure: 100000,
        mu: 2.3,
        temperature: 1200,
        material: 'hot gas reference layer',
        liquid: null,
        relief: 0,
    },
    {
        id: 'cool-gas',
        label: 'Cool gas-giant hypothesis',
        solid: false,
        pressure: 100000,
        mu: 2.3,
        temperature: 150,
        material: 'cool gas reference layer',
        liquid: null,
        relief: 0,
    },
]);
export const FAMILIES = families;
export const species = [
    'H2',
    'He',
    'N2',
    'H2O',
    'CO2',
    'CO',
    'CH4',
    'NH3',
    'O2',
    'O3',
    'Na',
    'K',
    'SO2',
    'H2S',
    'silicate_vapour',
    'metal_vapour',
];
export function seedNumber(value) {
    let h = 2166136261;
    for (const ch of value) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
    return h >>> 0;
}
function thermalConstraint(e) {
    const reported = central(adopted(e, 'equilibriumTemperature'));
    if (reported !== null) return reported;
    const t = central(adopted(e, 'hostTemperature')),
        r = central(adopted(e, 'hostRadius')),
        a = central(adopted(e, 'semiMajorAxis'));
    const l = central(adopted(e, 'hostLuminosity'));
    return a !== null && (l !== null || (t !== null && r !== null))
        ? equilibriumTemperature(l ?? luminosity(r, t), a, 0.3)
        : null;
}
export function availableScenarios(e) {
    if (['unverified', 'retracted', 'false_positive'].includes(e.object.existence.status))
        return [];
    const r = central(adopted(e, 'radius')),
        star = central(adopted(e, 'hostTemperature'));
    if (r === null && star === null) return [];
    const re = r === null ? null : r / C.earthRadius,
        t = thermalConstraint(e);
    // These are model applicability envelopes, not posterior probabilities or classification boundaries.
    return families.filter((f) => {
        if (f.solid && re !== null && re > 4) return false;
        if (!f.solid && re !== null && re < 1.2) return false;
        if (f.id === 'icy' && t !== null && t > 300) return false;
        if (['ocean', 'temperate-rocky'].includes(f.id) && t !== null && (t < 120 || t > 450))
            return false;
        if (f.id === 'lava' && t !== null && t < 650) return false;
        if (f.id === 'scorched-rocky' && t !== null && t < 400) return false;
        if (f.id === 'hot-gas' && t !== null && t < 600) return false;
        if (f.id === 'cool-gas' && t !== null && t > 650) return false;
        return true;
    });
}
export async function makeRecipe(
    e,
    {
        family,
        sandbox = false,
        seed = '0',
        weatherSeed = '0',
        assumedPressure,
        assumedTemperature,
        assumedGravity,
    } = {}
) {
    const f = families.find((v) => v.id === family);
    invariant(f, 'Unsupported scenario family');
    invariant(
        sandbox || availableScenarios(e).some((v) => v.id === family),
        'This family is outside the declared model applicability envelope'
    );
    seed = String(seed ?? '0');
    weatherSeed = String(weatherSeed ?? '0');
    invariant(seed.length <= 64 && weatherSeed.length <= 64, 'Seed exceeds replay contract');
    const assumptions = [],
        assume = (id, label, value, unit, reason) => {
            assumptions.push({ id, label, value, unit, reason });
            return value;
        };
    const measuredRadius = central(adopted(e, 'radius'));
    const radius =
        measuredRadius ??
        assume(
            'radius',
            'Reference radius',
            f.solid ? 4000000 : 40000000,
            'm',
            'Hypothetical radius for this explicitly selected scenario; no catalogue value is filled.'
        );
    const reportedGravity = central(adopted(e, 'gravity'));
    if (reportedGravity !== null && assumedGravity !== undefined)
        invariant(
            Math.abs(Number(assumedGravity) - reportedGravity) <
                Math.max(1e-6, reportedGravity * 1e-6),
            'An assumed gravity cannot replace the adopted mass/radius calculation. Select another published parameter set.'
        );
    const g =
        reportedGravity ??
        (assumedGravity !== undefined
            ? assume(
                  'gravity',
                  'Reference gravity',
                  Number(assumedGravity),
                  'm s-2',
                  'User-edited scenario assumption.'
              )
            : assume(
                  'gravity',
                  'Reference gravity',
                  f.solid ? 8 : 15,
                  'm s-2',
                  'Mass is insufficiently constrained for a measured reference gravity.'
              ));
    let temperature =
        assumedTemperature !== undefined ? Number(assumedTemperature) : thermalConstraint(e);
    if (temperature === null) temperature = f.temperature;
    // A surface or atmospheric reference temperature is always a scenario assumption,
    // even when its nominal value is guided by a separately typed equilibrium model.
    if (f.id === 'lava' && assumedTemperature === undefined)
        temperature = Math.max(1500, temperature);
    if (f.id === 'ocean' && assumedTemperature === undefined) temperature = f.temperature;
    assume(
        'temperature',
        f.solid
            ? 'Assumed surface reference temperature'
            : 'Assumed atmosphere reference temperature',
        temperature,
        'K',
        'Scenario temperature; equilibrium and surface/atmospheric temperatures are not interchangeable. Internal heat, redistribution and greenhouse effects are not solved.'
    );
    const pressure = assumedPressure !== undefined ? Number(assumedPressure) : f.pressure;
    if (f.pressure === 0)
        invariant(
            pressure === 0,
            'An airless scenario has zero atmospheric pressure. Select an atmospheric family to change pressure.'
        );
    assume(
        'pressure',
        'Reference pressure',
        pressure,
        'Pa',
        pressure === 0
            ? 'This is an airless hypothesis. Absence of an atmosphere has not been measured by this catalogue.'
            : 'Pressure and its radius reference are assumed; transmission radii do not establish a 1-bar surface.'
    );
    invariant(
        Number.isFinite(temperature) &&
            temperature >= 30 &&
            temperature <= 3000 &&
            Number.isFinite(g) &&
            g >= 0.1 &&
            g <= 1000 &&
            Number.isFinite(pressure) &&
            pressure >= 0 &&
            pressure <= 1e6,
        'Scenario is outside the validated physical domain'
    );
    if (f.id === 'ocean')
        invariant(
            temperature >= 273.15 && temperature <= 373.15 && pressure >= 100000,
            'Liquid-water scenario outside its declared simplified phase envelope'
        );
    if (f.id === 'icy')
        invariant(
            temperature < 273.15,
            'Water-ice scenario requires a sub-freezing reference temperature'
        );
    if (f.id === 'lava')
        invariant(
            temperature >= 1400,
            'Molten-silicate scenario requires its declared high-temperature domain'
        );
    const composition =
        pressure === 0
            ? []
            : f.solid
              ? [{ species: 'N2', moleFraction: 1 }]
              : [
                    { species: 'H2', moleFraction: 0.85 },
                    { species: 'He', moleFraction: 0.15 },
                ];
    if (pressure > 0)
        assume(
            'composition',
            'Bulk gas composition',
            f.solid ? 'N₂-dominated' : 'H₂ 85%, He 15%',
            'mole fraction',
            'A hypothetical bulk mixture. Trace species reported in the evidence do not establish these abundances.'
        );
    assume(
        'material',
        'Material family',
        f.material,
        '',
        'Hypothetical optical material and roughness; no spatial reflectance map is supplied.'
    );
    assume(
        'geology',
        'Spatial structure',
        'continuous procedural fields',
        '',
        'Noise, impacts, ridges and fractures approximate morphology; no circulation, tectonics or erosion solver is claimed.'
    );
    assume(
        'phase',
        'Viewing phase / spin axis',
        'inspection orientation',
        '',
        'The camera geometry and frozen reference orientation are not a verified present-day ephemeris.'
    );
    assume(
        'albedo',
        'Thermal-model Bond albedo',
        0.3,
        '1',
        'Only used by the named globally redistributed grey equilibrium guide when the host inputs exist.'
    );
    const hostTemperature = central(adopted(e, 'hostTemperature')),
        illumination =
            hostTemperature !== null && hostTemperature >= 2000 && hostTemperature <= 50000
                ? {
                      kind: 'blackbody',
                      temperature: hostTemperature,
                      label: `${Math.round(hostTemperature)} K host blackbody approximation`,
                      sourceQuantityIds: [adopted(e, 'hostTemperature').id],
                      hostRadiusMetres: central(adopted(e, 'hostRadius')),
                      separationMetres: central(adopted(e, 'semiMajorAxis')),
                  }
                : {
                      kind: 'schematic',
                      temperature: null,
                      label: 'Neutral schematic inspection lighting',
                      sourceQuantityIds: [],
                  };
    const profile = hydrostaticProfile({ temperature, mu: f.mu, gravity: g, pressure, radius });
    const albedoObservation = (e.observations || []).find(
        (o) => o.observable === 'geometric_albedo' && o.wavelengthUnit === 'nm'
    );
    const reflectance = albedoObservation
        ? {
              kind: 'published-broadband-albedo',
              observationId: albedoObservation.id,
              claimId: albedoObservation.claimId,
              bands: albedoObservation.bands,
              model: 'Lambertian conversion of geometric albedo to a bounded RGB material approximation',
              outsideBandAlbedo: 0.03,
          }
        : null;
    if (reflectance)
        assume(
            'visible-reflectance',
            'Unobserved spectral interpolation',
            'piecewise band albedo; half of a reported upper limit; albedo 0.03 outside the bands',
            '1',
            'A conditional broad-band reflectance model uses the actual published visible constraints. Spectral interpolation, wavelengths outside the bands, scattering phase and spatial patterns remain assumed.'
        );
    const cloudEligible = pressure > 0 && (!f.solid || f.id === 'ocean');
    const cloudMaterial = 'unidentified grey aerosol optical hypothesis';
    if (cloudEligible)
        assume(
            'clouds',
            'Condensate / aerosol layer',
            cloudMaterial,
            '',
            'An assumed optical particle layer; this reduced model does not solve condensation chemistry or establish a cloud altitude observationally.'
        );
    const input = {
        objectId: e.object.id,
        parameterSetId: e.adoptedParameterSetId,
        evidenceReleaseId: e.releaseId,
        generatorVersion: GENERATOR,
        policyVersion: POLICY,
        family,
        geologicalSeed: seed,
        weatherSeed,
        assumptions,
    };
    const geologyIdentity = {
        objectId: e.object.id,
        parameterSetId: e.adoptedParameterSetId,
        generatorVersion: GENERATOR,
        family,
        geologicalSeed: seed,
        radius,
        gravity: g,
        temperature,
        pressure,
        material: f.material,
    };
    const recipe = {
        ...input,
        id: await sha256(stableJSON(input)),
        sandbox,
        seedInt: seedNumber(stableJSON(geologyIdentity)),
        weatherSeedInt: seedNumber(`${e.object.id}:${weatherSeed}:${GENERATOR}:weather`),
        solidSurface: f.solid,
        referenceRadiusMetres: radius,
        radiusKind: measuredRadius === null ? 'assumed' : adopted(e, 'radius').epistemicKind,
        reflectance,
        referenceGravity: g,
        referenceTemperature: temperature,
        material: f.material,
        liquid: f.liquid,
        reliefMetres: Math.min(f.relief, radius * 0.004),
        illumination,
        atmosphere: {
            pressurePa: pressure,
            meanMolecularWeight: f.mu,
            composition,
            profile,
            model: 'spherical-isothermal-hydrostatic-rayleigh-1',
            multipleScattering: 'not solved; single scattering approximation',
            refractiveIndex: f.solid ? 1.000298 : 1.000132,
            referenceNumberDensity: 2.547e25,
            kingFactor: 1,
            absorption:
                'No vetted absorption-opacity table is ingested; grey aerosol absorption is assumed and disclosed.',
        },
        clouds: {
            enabled: cloudEligible,
            material: cloudEligible ? cloudMaterial : null,
            baseScaleHeights: 1.4,
            topScaleHeights: 2.5,
            opticalDepth: cloudEligible ? 7 : 0,
            coverage: cloudEligible ? 0.53 : 0,
            clock: 'seconds since recipe replay origin',
            dynamics:
                'Procedural advection, independent weather seed; not current observed weather.',
        },
        validation: {
            passed: true,
            checks: [
                'finite positive reference radius and gravity',
                'named material/temperature domain',
                'hydrostatic scale-height/radius domain',
                'assumptions separate from observations',
            ],
            statisticalFit: null,
        },
        modelRuns: [],
    };
    return freeze(recipe);
}
