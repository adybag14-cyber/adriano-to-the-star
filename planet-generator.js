// --- SIMPLE NOISE (CPU) ---
if (typeof SimpleNoise === 'undefined') {
    window.SimpleNoise = class {
        constructor(seed = Math.random()) {
            this.grad3 = [
                [1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0],
                [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1],
                [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1]
            ];
            this.p = [];
            this.perm = [];
            for (let i = 0; i < 256; i++) { this.p[i] = Math.floor(this.seed(seed * i) * 256); }
            for (let i = 0; i < 512; i++) { this.perm[i] = this.p[i & 255]; }
        }
        seed(s) { const x = Math.sin(s) * 10000; return x - Math.floor(x); }
        dot(g, x, y, z) { return g[0] * x + g[1] * y + g[2] * z; }
        mix(a, b, t) { return (1 - t) * a + t * b; }
        fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
        noise(x, y, z) {
            const X = Math.floor(x) & 255, Y = Math.floor(y) & 255, Z = Math.floor(z) & 255;
            x -= Math.floor(x); y -= Math.floor(y); z -= Math.floor(z);
            const u = this.fade(x), v = this.fade(y), w = this.fade(z);
            const A = this.perm[X] + Y, AA = this.perm[A] + Z, AB = this.perm[A + 1] + Z,
                B = this.perm[X + 1] + Y, BA = this.perm[B] + Z, BB = this.perm[B + 1] + Z;
            return this.mix(this.mix(this.mix(this.dot(this.grad3[this.perm[AA] % 12], x, y, z),
                this.dot(this.grad3[this.perm[BA] % 12], x - 1, y, z), u),
                this.mix(this.dot(this.grad3[this.perm[AB] % 12], x, y - 1, z),
                    this.dot(this.grad3[this.perm[BB] % 12], x - 1, y - 1, z), u), v),
                this.mix(this.mix(this.dot(this.grad3[this.perm[AA + 1] % 12], x, y, z - 1),
                    this.dot(this.grad3[this.perm[BA + 1] % 12], x - 1, y, z - 1), u),
                    this.mix(this.dot(this.grad3[this.perm[AB + 1] % 12], x, y - 1, z - 1),
                        this.dot(this.grad3[this.perm[BB + 1] % 12], x - 1, y - 1, z - 1), u), v), w);
        }
    };
}


const PLANET_TERRAIN_VERSION = 'catalog-informed-v4-geology';

function terrainClamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function terrainSmoothstep(a, b, v) {
    const t = terrainClamp((v - a) / Math.max(1e-6, b - a), 0, 1);
    return t * t * (3 - 2 * t);
}
function terrainNumber(v, fallback) {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
}
function terrainHash(seed, salt = 0) {
    const x = Math.sin((terrainNumber(seed, 12345) + salt * 374.761) * 12.9898) * 43758.5453;
    return x - Math.floor(x);
}
function terrainDirection(seed, index, salt = 0) {
    const u = terrainHash(seed, salt + index * 2 + 1);
    const v = terrainHash(seed, salt + index * 2 + 2);
    const y = u * 2 - 1;
    const theta = v * Math.PI * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    return { x: r * Math.cos(theta), y, z: r * Math.sin(theta) };
}

const terrainFeatureCache = new Map();
function getTerrainFeatures(seed, type, craterRetention = 0.5) {
    const worldType = String(type || 'planet').toLowerCase();
    const craterCount = worldType === 'moon' ? 22 : Math.round(4 + craterRetention * 7);
    const key = `${terrainNumber(seed, 12345)}:${worldType}:${craterCount}`;
    if (terrainFeatureCache.has(key)) return terrainFeatureCache.get(key);
    const plateCount = worldType === 'moon' ? 5 : 7;
    const plates = Array.from({ length: plateCount }, (_, i) => terrainDirection(seed, i, 101));
    const craters = Array.from({ length: craterCount }, (_, i) => ({
        direction: terrainDirection(seed, i, 211),
        radius: 0.038 + terrainHash(seed, 251 + i) * (worldType === 'moon' ? 0.12 : 0.075),
        depth: 0.035 + terrainHash(seed, 281 + i) * (worldType === 'moon' ? 0.16 : 0.075)
    }));
    const features = { plates, craters };
    terrainFeatureCache.set(key, features);
    if (terrainFeatureCache.size > 24) terrainFeatureCache.delete(terrainFeatureCache.keys().next().value);
    return features;
}

function normalizePlanetPhysicalProfile(profile = null, seed = 12345, type = 'planet') {
    const src = profile && typeof profile === 'object' ? profile : {};
    const worldType = String(type || 'planet').toLowerCase();
    const isMoon = worldType === 'moon';
    const isLava = worldType === 'lava' || worldType === 'volcanic';
    const isIce = worldType === 'ice' || worldType === 'frozen';
    const isGas = worldType === 'gas' || worldType === 'giant';
    const isDesert = worldType === 'desert' || worldType === 'arid';

    const inferredRadius = isMoon ? 0.27
        : isGas ? 7.0 + terrainHash(seed, 2) * 7.0
            : 0.72 + terrainHash(seed, 2) * 1.18;
    const radiusEarth = terrainClamp(
        terrainNumber(src.radiusEarth ?? src.radius ?? src.pl_rade, inferredRadius),
        0.08,
        isGas ? 18 : 4.5
    );
    const inferredMass = isMoon ? Math.pow(radiusEarth, 3.1)
        : isGas ? 35 + terrainHash(seed, 3) * 260
            : Math.pow(radiusEarth, radiusEarth < 1.5 ? 3.2 : 2.35);
    const massEarth = terrainClamp(
        terrainNumber(src.massEarth ?? src.mass ?? src.pl_bmasse, inferredMass),
        0.005,
        isGas ? 700 : 100
    );
    const gravityEarth = terrainClamp(massEarth / Math.max(0.01, radiusEarth * radiusEarth), 0.05, 8);
    // Procedural orbital forcing is conditioned on the requested world class so a world cannot
    // be labeled `lava` while receiving outer-system flux, or `ice` while receiving inner-system flux.
    // Catalog-provided insolation always overrides these scenario priors.
    const inferredInsolation = isLava ? 40 + terrainHash(seed, 4) * 210
        : isIce ? 0.025 + terrainHash(seed, 4) * 0.34
            : isGas ? 0.025 + terrainHash(seed, 4) * 79.0
                : isDesert ? 0.70 + terrainHash(seed, 4) * 3.4
                    : 0.28 + terrainHash(seed, 4) * 1.85;
    const insolationEarth = terrainClamp(
        terrainNumber(src.insolationEarth ?? src.insolation ?? src.pl_insol, inferredInsolation),
        0.01,
        260
    );
    const hostStar = String(src.hostStar ?? src.host_star ?? src.stellar_type ?? 'unknown');
    const inferredStellarTemperature = /m-type|red dwarf/i.test(hostStar) ? 3400
        : /k-type/i.test(hostStar) ? 4600
            : /f-type/i.test(hostStar) ? 6500
                : /a-type/i.test(hostStar) ? 8200
                    : 5600;
    const stellarTemperatureK = terrainClamp(
        terrainNumber(src.stellarTemperatureK ?? src.stellar_temperature ?? src.st_teff, inferredStellarTemperature),
        2200,
        12000
    );
    const fallbackEq = isLava ? 1100 + terrainHash(seed, 5) * 1050
        : isIce ? 125 + terrainHash(seed, 5) * 105
            : isGas ? 320 + terrainHash(seed, 5) * 1050
                : 255 * Math.pow(insolationEarth, 0.25);
    const suppliedEquilibriumRaw = src.equilibriumTemperatureK ?? src.equilibrium_temperature ?? src.eq_temperature ?? src.pl_eqt;
    const suppliedEquilibriumNumber = Number(suppliedEquilibriumRaw);
    const hasSuppliedEquilibrium = Number.isFinite(suppliedEquilibriumNumber);
    const preliminaryEquilibriumTemperatureK = terrainClamp(
        hasSuppliedEquilibrium ? suppliedEquilibriumNumber : fallbackEq,
        45,
        3000
    );
    const orbitalPeriodDays = terrainNumber(src.orbitalPeriodDays ?? src.koi_period ?? src.period ?? src.pl_orbper, NaN);
    const temperateWindow = Math.exp(-Math.pow((preliminaryEquilibriumTemperatureK - 273) / 105, 2));

    let waterPotential = isMoon || isLava || isGas ? (isLava ? 0.015 : 0)
        : isDesert ? terrainClamp(0.025 + terrainHash(seed, 7) * 0.09, 0.02, 0.12)
            : terrainClamp((0.18 + terrainHash(seed, 7) * 0.62) * (0.34 + temperateWindow * 0.66), 0.04, 0.82);
    if (isIce) waterPotential = terrainClamp(0.32 + terrainHash(seed, 8) * 0.38, 0.28, 0.74);

    const atmosphereRetention = isMoon ? 0.04 : isGas ? 1.45 : terrainClamp(
        gravityEarth * Math.sqrt(288 / Math.max(80, preliminaryEquilibriumTemperatureK)) * 0.68, 0.06, 1.45
    );
    const weathering = isMoon ? 0.03 : isGas ? 0 : terrainClamp(
        waterPotential * Math.min(1, atmosphereRetention) * (0.45 + temperateWindow * 0.55), 0.04, 0.92
    );
    const craterRetention = isMoon ? 1 : isGas ? 0 : terrainClamp(0.96 - weathering * 0.78, 0.22, 0.96);
    const reliefScale = isGas ? 0 : terrainClamp(Math.pow(gravityEarth, -0.32), 0.70, 1.28);
    const explicitLock = typeof src.tidallyLocked === 'boolean' ? src.tidallyLocked : null;
    const inferredLock = Number.isFinite(orbitalPeriodDays) && orbitalPeriodDays <= 25
        && /m-type|red dwarf/i.test(hostStar);
    const tidallyLocked = explicitLock === null ? inferredLock : explicitLock;

    // Reduced-order climate proxies. These are scenario variables for rendering/gameplay, not observations.
    const coldIndex = terrainClamp((268 - preliminaryEquilibriumTemperatureK) / 115, 0, 1);
    const hotIndex = terrainClamp((preliminaryEquilibriumTemperatureK - 315) / 900, 0, 1);
    const icePotential = isMoon || isGas || isLava ? 0 : isIce ? 0.96 : terrainClamp(
        coldIndex * (0.62 + waterPotential * 0.38), 0, 0.96
    );
    const cloudPotential = isMoon || isLava ? 0 : terrainClamp(
        (isGas ? 0.72 : waterPotential * Math.min(1, atmosphereRetention))
        * (0.54 + temperateWindow * 0.46),
        0,
        0.94
    );
    const aridity = isMoon || isGas ? 1 : terrainClamp(
        (1 - waterPotential) * 0.72 + hotIndex * 0.42 - cloudPotential * 0.18 + (isDesert ? 0.24 : 0),
        0,
        1
    );
    const inferredBondAlbedo = terrainClamp(
        0.09 + cloudPotential * 0.24 + icePotential * 0.34 + (isGas ? 0.15 : waterPotential * 0.07),
        0.04,
        0.78
    );
    const bondAlbedo = terrainClamp(
        terrainNumber(src.bondAlbedo ?? src.bond_albedo ?? src.albedo, inferredBondAlbedo),
        0.01,
        0.90
    );
    // Zero-dimensional radiative equilibrium proxy: absorbed stellar flux after Bond albedo.
    // If a catalog explicitly provides equilibrium temperature, keep that value authoritative;
    // otherwise use this internally consistent estimate for the procedural climate scenario.
    const radiativeEquilibriumTemperatureK = terrainClamp(
        278.5 * Math.pow(Math.max(1e-6, insolationEarth * (1 - bondAlbedo)), 0.25),
        45,
        3000
    );
    const equilibriumTemperatureK = hasSuppliedEquilibrium
        ? preliminaryEquilibriumTemperatureK
        : radiativeEquilibriumTemperatureK;
    const greenhouseOffsetK = isMoon ? 0 : isGas ? 0 : terrainClamp(
        6 + Math.min(1.25, atmosphereRetention) * (13 + waterPotential * 24)
        + Math.max(0, equilibriumTemperatureK - 330) * 0.055,
        0,
        180
    );
    const estimatedSurfaceTemperatureK = terrainClamp(
        terrainNumber(src.surfaceTemperatureK ?? src.surface_temperature, equilibriumTemperatureK + greenhouseOffsetK),
        45,
        3200
    );
    const climateContrast = terrainClamp(
        tidallyLocked ? 0.30 + (1 - Math.min(1, atmosphereRetention)) * 0.48 + hotIndex * 0.18 : 0.08,
        0.05,
        0.88
    );
    const climateRegime = isGas ? (estimatedSurfaceTemperatureK >= 1200 ? 'ultra-hot-giant' : 'gas-giant')
        : isLava ? 'magma-dominated'
            : isIce ? (estimatedSurfaceTemperatureK < 190 ? 'cryogenic-ice' : 'ice-world')
                : isDesert ? (estimatedSurfaceTemperatureK >= 360 ? 'hot-arid' : 'arid')
                    : estimatedSurfaceTemperatureK >= 900 ? 'magma-dominated'
                        : estimatedSurfaceTemperatureK < 190 ? 'cryogenic'
                            : estimatedSurfaceTemperatureK < 250 ? 'cold'
                                : estimatedSurfaceTemperatureK < 330 ? 'temperate-scenario'
                                    : estimatedSurfaceTemperatureK < 650 ? 'hot-rocky'
                                        : 'ultra-hot-rocky';

    return {
        worldType, radiusEarth, massEarth, gravityEarth, insolationEarth, equilibriumTemperatureK,
        estimatedSurfaceTemperatureK, greenhouseOffsetK, bondAlbedo, radiativeEquilibriumTemperatureK,
        catalogEquilibriumTemperatureK: hasSuppliedEquilibrium ? preliminaryEquilibriumTemperatureK : null,
        stellarTemperatureK,
        orbitalPeriodDays: Number.isFinite(orbitalPeriodDays) ? orbitalPeriodDays : null,
        waterPotential, atmosphereRetention, weathering, craterRetention, reliefScale,
        icePotential, cloudPotential, aridity, climateContrast, climateRegime,
        tidallyLocked,
        provenance: src.provenance || (src.data_source ? 'catalog-constrained' : 'procedural-inference'),
        dataSource: src.data_source || src.dataSource || null,
        resolvedSurfaceData: false,
        climateModel: 'reduced-order-visual-scenario-v1'
    };
}

function computePlanetTerrainHeight(x, y, z, seed, physicalProfile, type, noise) {
    const profile = physicalProfile && physicalProfile.gravityEarth
        ? physicalProfile
        : normalizePlanetPhysicalProfile(physicalProfile, seed, type);
    const length = Math.hypot(x, y, z) || 1;
    const ux = x / length, uy = y / length, uz = z / length;
    const sample = (px, py, pz, f, salt) => noise.noise(
        px * f + salt * 0.071, py * f - salt * 0.053, pz * f + salt * 0.097
    );

    // Spherical domain warp prevents obvious latitude/longitude bands without introducing seams.
    const warpStrength = 0.13 + terrainHash(seed, 501) * 0.06;
    let wx = ux + sample(ux, uy, uz, 1.65, 53) * warpStrength;
    let wy = uy + sample(ux, uy, uz, 1.65, 59) * warpStrength;
    let wz = uz + sample(ux, uy, uz, 1.65, 61) * warpStrength;
    const wl = Math.hypot(wx, wy, wz) || 1;
    wx /= wl; wy /= wl; wz /= wl;

    // Low-frequency basins/continents plus a ridged multifractal mountain field.
    const broad = sample(wx, wy, wz, 0.92, 71) * 0.62 + sample(wx, wy, wz, 1.78, 79) * 0.38;
    let ridge = 0, amp = 0.5, freq = 3.7, weight = 0;
    for (let octave = 0; octave < 4; octave++) {
        let n = sample(wx, wy, wz, freq, 91 + octave * 7);
        n = 1 - Math.abs(n);
        n *= n;
        ridge += n * amp;
        weight += amp;
        freq *= 2;
        amp *= 0.5;
    }
    ridge /= Math.max(1e-6, weight);

    const seaLevel = 0.535 + (profile.waterPotential - 0.42) * 0.10;
    const terrainSignal = ridge + broad * 0.105;
    let displacement;
    if (terrainSignal > seaLevel) {
        const land = terrainClamp((terrainSignal - seaLevel) / Math.max(0.001, 1 - seaLevel), 0, 1);
        const shaped = land * land * (3 - 2 * land);
        displacement = shaped * 1.22 * profile.reliefScale;
    } else {
        displacement = -0.45 + terrainSmoothstep(-0.75, seaLevel, terrainSignal) * 0.085;
    }

    // Coarse spherical Voronoi plates: seed-dependent geometry is cached once per world.
    const terrainFeatures = getTerrainFeatures(seed, type, profile.craterRetention);
    let best = -Infinity, second = -Infinity, bestIndex = -1, secondIndex = -1;
    for (let i = 0; i < terrainFeatures.plates.length; i++) {
        const p = terrainFeatures.plates[i];
        const score = ux * p.x + uy * p.y + uz * p.z;
        if (score > best) {
            second = best; secondIndex = bestIndex; best = score; bestIndex = i;
        } else if (score > second) {
            second = score; secondIndex = i;
        }
    }
    const boundary = 1 - terrainSmoothstep(0.018, 0.125, best - second);
    const pairSalt = (Math.min(bestIndex, secondIndex) + 1) * 41 + (Math.max(bestIndex, secondIndex) + 1) * 67;
    const polarity = terrainHash(seed, 401 + pairSalt) > 0.36 ? 1 : -0.62;
    const plateScale = type === 'moon' ? 0.045 : 0.17 * (1 - profile.weathering * 0.28);
    displacement += boundary * polarity * plateScale * profile.reliefScale;

    // Seeded impact morphology is stronger on old/dry/thin-atmosphere scenarios.
    for (const crater of terrainFeatures.craters) {
        const c = crater.direction;
        const radius = crater.radius;
        const depth = crater.depth;
        const dot = terrainClamp(ux * c.x + uy * c.y + uz * c.z, -1, 1);
        const q = Math.sqrt(Math.max(0, 2 - 2 * dot)) / radius;
        if (q < 1) {
            const bowl = 1 - q * q;
            displacement -= depth * bowl * bowl * profile.craterRetention * profile.reliefScale;
        }
        if (q < 1.34) {
            displacement += depth * 0.34 * Math.exp(-Math.pow((q - 1.04) / 0.13, 2))
                * profile.craterRetention * profile.reliefScale;
        }
    }

    // Fine-scale geologic breakup: dry worlds preserve sharp talus/ridge structure while
    // wetter worlds preferentially accumulate sediment in low basins. This field is evaluated
    // by both the rendered mesh and logical tile height function, preserving placement alignment.
    const fineRidge = 1 - Math.abs(sample(wx, wy, wz, 10.5, 613));
    const drainage = 1 - Math.abs(sample(wx, wy, wz, 7.4, 641));
    const fracture = 1 - Math.abs(sample(wx, wy, wz, 18.5, 677));
    const exposedRock = Math.pow(terrainClamp(fineRidge, 0, 1), 4) * (0.62 + Math.pow(terrainClamp(fracture, 0, 1), 3) * 0.38);
    const dryRelief = 1 - profile.weathering * 0.62;
    if (displacement > -0.08) displacement += (exposedRock - 0.24) * 0.052 * dryRelief * profile.reliefScale;
    const basinSediment = terrainSmoothstep(-0.34, 0.18, displacement) * (1 - terrainSmoothstep(0.18, 0.44, displacement));
    displacement -= basinSediment * terrainClamp(drainage, 0, 1) * profile.weathering * 0.026;

    if (displacement > 0.42) {
        displacement = 0.42 + (displacement - 0.42) * (1 - profile.weathering * 0.18);
    }
    return terrainClamp(displacement, -0.45, 1.35);
}


class PlanetGenerator {
    constructor() {
        this.shaders = {
            standard: this.getStandardShader(),
            lava: this.getLavaShader(),
            ice: this.getIceShader(),
            gas: this.getGasShader()
        };
    }

    calculateHeight(x, y, z, seed, physicalProfile = null, type = 'planet') {
        if (!this.noiseGen || this.lastSeed !== seed) {
            this.noiseGen = new SimpleNoise(seed || 12345);
            this.lastSeed = seed;
        }
        const profile = normalizePlanetPhysicalProfile(physicalProfile, seed, type);
        return computePlanetTerrainHeight(x, y, z, seed, profile, type, this.noiseGen);
    }

    // --- HYPER-REAL TERRAIN SHADER (Revised Stable) ---
    getStandardShader() {
        const noiseCommon = `
            vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
            vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
            vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
            vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
            vec3 fade(vec3 t) { return t*t*t*(t*(t*6.0-15.0)+10.0); }
            float cnoise(vec3 P) {
                vec3 Pi0 = floor(P); vec3 Pi1 = Pi0 + vec3(1.0);
                Pi0 = mod289(Pi0); Pi1 = mod289(Pi1);
                vec3 Pf0 = fract(P); vec3 Pf1 = Pf0 - vec3(1.0);
                vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x); vec4 iy = vec4(Pi0.y, Pi0.y, Pi1.y, Pi1.y);
                vec4 iz0 = Pi0.zzzz; vec4 iz1 = Pi1.zzzz;
                vec4 ixy = permute(permute(ix) + iy);
                vec4 ixy0 = permute(ixy + iz0); vec4 ixy1 = permute(ixy + iz1);
                vec4 gx0 = ixy0 * (1.0 / 7.0); vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
                gx0 = fract(gx0); vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
                vec4 sz0 = step(gz0, vec4(0.0));
                gx0 -= sz0 * (step(0.0, gx0) - 0.5); gy0 -= sz0 * (step(0.0, gy0) - 0.5);
                vec4 gx1 = ixy1 * (1.0 / 7.0); vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
                gx1 = fract(gx1); vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
                vec4 sz1 = step(gz1, vec4(0.0));
                gx1 -= sz1 * (step(0.0, gx1) - 0.5); gy1 -= sz1 * (step(0.0, gy1) - 0.5);
                vec3 g000 = vec3(gx0.x,gy0.x,gz0.x); vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
                vec3 g010 = vec3(gx0.z,gy0.z,gz0.z); vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
                vec3 g001 = vec3(gx1.x,gy1.x,gz1.x); vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
                vec3 g011 = vec3(gx1.z,gy1.z,gz1.z); vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);
                vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
                g000 *= norm0.x; g010 *= norm0.y; g100 *= norm0.z; g110 *= norm0.w;
                vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
                g001 *= norm1.x; g011 *= norm1.y; g101 *= norm1.z; g111 *= norm1.w;
                vec3 fade_xyz = fade(Pf0);
                
                float n000 = dot(g000, Pf0);
                float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
                float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
                float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
                float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
                float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
                float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
                float n111 = dot(g111, Pf1);
                vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
                vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
                float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x); 
                return 2.2 * n_xyz;
            }
        `;

        return {
            vShader: `
                varying vec3 vWorldNormal;
                varying vec3 vLocalNormal;
                varying vec3 vPosition;
                varying vec3 vWorldPosition;
                varying vec2 vUv;

                void main() {
                    vUv = uv;
                    vLocalNormal = normalize(normal);
                    vWorldNormal = normalize(mat3(modelMatrix) * normal);
                    vPosition = position;
                    vec4 worldPos = modelMatrix * vec4(position, 1.0);
                    vWorldPosition = worldPos.xyz;
                    gl_Position = projectionMatrix * viewMatrix * worldPos;
                }
            `,
            fShader: `
                uniform float seed;
                uniform vec3 colorWater;
                uniform vec3 colorSand;
                uniform vec3 colorGrass;
                uniform vec3 colorRock;
                uniform vec3 colorSnow;
                uniform vec3 sunDirection;
                uniform float waterPotential;
                uniform float icePotential;
                uniform float surfaceTemperatureK;
                uniform float tidallyLocked;
                uniform float climateContrast;
                uniform float terrainDetail;
                
                varying vec3 vWorldNormal;
                varying vec3 vLocalNormal;
                varying vec3 vPosition;
                varying vec3 vWorldPosition;
                
                ${noiseCommon}

                // Roadmap Item 1: Global Illumination Approximation
                float getGI(vec3 p, vec3 n) {
                    return clamp(dot(n, vec3(0,1,0)) * 0.5 + 0.5, 0.0, 1.0);
                }

                void main() {
                    float dist = length(vPosition);
                    float h = dist - 50.0;

                    vec3 sphere = normalize(vPosition);
                    float detailFrequency = clamp(terrainDetail, 0.55, 1.35);
                    float detail = cnoise(sphere * (18.0 * detailFrequency) + vec3(seed * 0.013));
                    float micro = cnoise(sphere * (52.0 * detailFrequency) - vec3(seed * 0.007));
                    float mineral = cnoise(sphere * (86.0 * detailFrequency) + vec3(seed * 0.021));
                    float strata = 0.5 + 0.5 * sin((h * 31.0 + cnoise(sphere * 13.0) * 2.8) * detailFrequency);
                    float fractureMask = 1.0 - smoothstep(0.025, 0.17, abs(cnoise(sphere * (34.0 * detailFrequency) + vec3(seed * 0.005))));
                    float sedimentNoise = 0.5 + 0.5 * cnoise(sphere * (24.0 * detailFrequency) - vec3(seed * 0.018));
                    float basinMask = 1.0 - smoothstep(-0.18, 0.10, h);
                    float waterMask = basinMask * smoothstep(0.08, 0.30, waterPotential);
                    float coast = smoothstep(-0.10, 0.02, h) * (1.0 - smoothstep(0.02, 0.12, h));
                    float slope = clamp(1.0 - dot(normalize(vLocalNormal), sphere), 0.0, 0.24) / 0.24;

                    vec3 dryBasin = mix(colorRock * 0.52, colorSand * 0.72, 0.45 + detail * 0.18);
                    vec3 albedo = mix(dryBasin, colorWater * (0.82 + detail * 0.08), waterMask);
                    albedo = mix(albedo, colorSand * (0.96 + micro * 0.08), smoothstep(-0.16, 0.06, h) * (1.0 - waterMask));
                    albedo = mix(albedo, colorGrass * (0.88 + detail * 0.12), smoothstep(0.03, 0.28, h));
                    float rockMask = max(smoothstep(0.56 + detail * 0.08, 0.90 + detail * 0.06, h), slope * 0.72);
                    vec3 layeredRock = colorRock * (0.79 + mineral * 0.11 + strata * 0.13);
                    layeredRock = mix(layeredRock, colorSand * 0.72, fractureMask * 0.16);
                    albedo = mix(albedo, layeredRock, rockMask);
                    float sedimentMask = smoothstep(-0.20, 0.18, h) * (1.0 - smoothstep(0.18, 0.42, h)) * (1.0 - waterMask);
                    albedo = mix(albedo, colorSand * (0.82 + sedimentNoise * 0.18), sedimentMask * 0.34);
                    float snowLine = mix(1.08, 0.28, icePotential);
                    float snowMask = smoothstep(snowLine + detail * 0.06, snowLine + 0.20, h);
                    albedo = mix(albedo, colorSnow, snowMask * (0.28 + icePotential * 0.72));
                    albedo = mix(albedo, colorSand * 1.08, coast * 0.30);

                    vec3 N = normalize(vWorldNormal);
                    vec3 L = normalize(sunDirection);
                    vec3 V = normalize(cameraPosition - vWorldPosition);
                    vec3 up = abs(N.y) < 0.94 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
                    vec3 T = normalize(cross(up, N));
                    vec3 B = normalize(cross(N, T));
                    float bumpX = cnoise(sphere * (70.0 * detailFrequency) + vec3(7.0, 0.0, 0.0));
                    float bumpY = cnoise(sphere * (70.0 * detailFrequency) + vec3(0.0, 11.0, 0.0));
                    float bumpStrength = mix(0.085, 0.018, waterMask) * mix(0.72, 1.20, clamp((terrainDetail - 0.55) / 0.80, 0.0, 1.0));
                    N = normalize(N + T * bumpX * bumpStrength + B * bumpY * bumpStrength);

                    float NdotL = max(dot(N, L), 0.0);
                    vec3 H = normalize(L + V);
                    float NdotH = max(dot(N, H), 0.0);
                    float roughness = mix(0.74 - micro * 0.08, 0.10, waterMask);
                    float landSpec = pow(NdotH, mix(18.0, 42.0, 1.0 - roughness)) * 0.08;
                    float waterSpec = pow(NdotH, 118.0) * waterMask * 1.30;
                    float fresnel = pow(1.0 - max(dot(N, V), 0.0), 5.0);
                    vec3 specular = vec3(landSpec) + vec3(0.48, 0.72, 0.96) * (waterSpec + fresnel * waterMask * 0.28);

                    float gi = getGI(vWorldPosition, N);
                    float twilight = smoothstep(-0.15, 0.08, dot(N, L));
                    // Preserve a low, cool bounce floor on the night side so terrain remains playable
                    // without flattening the physically coherent terminator/direct-light response.
                    float nightBounce = 0.145 + gi * 0.035;
                    float diffuseLight = mix(nightBounce, 0.27 + NdotL * 0.70 + gi * 0.055, twilight);
                    float lockedNight = tidallyLocked * (1.0 - smoothstep(-0.38, 0.10, dot(N, L))) * climateContrast;
                    vec3 coldTrapTint = mix(albedo, colorSnow * 0.72, clamp(icePotential * 0.55 + lockedNight * 0.34, 0.0, 0.72));
                    albedo = mix(albedo, coldTrapTint, lockedNight);
                    float heatTint = smoothstep(360.0, 850.0, surfaceTemperatureK);
                    albedo = mix(albedo, albedo * vec3(1.14, 0.78, 0.58), heatTint * 0.30);
                    vec3 finalColor = albedo * diffuseLight + specular * twilight;
                    finalColor += colorSand * coast * NdotL * 0.08;
                    float atmo = pow(1.0 - max(dot(V, N), 0.0), 4.2);
                    finalColor = mix(finalColor, vec3(0.30, 0.58, 0.92), atmo * 0.16 * twilight);

                    gl_FragColor = vec4(finalColor, 1.0);
                }
            `
        };
    }

    getLavaShader() {
        return {
            vShader: `
                varying vec3 vWorldNormal;
                varying vec3 vWorldPosition;
                varying vec3 vLocalPosition;
                void main() {
                    vec4 worldPos = modelMatrix * vec4(position, 1.0);
                    vWorldPosition = worldPos.xyz;
                    vWorldNormal = normalize(mat3(modelMatrix) * normal);
                    vLocalPosition = position;
                    gl_Position = projectionMatrix * viewMatrix * worldPos;
                }
            `,
            fShader: `
                uniform float seed;
                uniform float time;
                uniform float surfaceTemperatureK;
                uniform vec3 sunDirection;
                varying vec3 vWorldNormal;
                varying vec3 vWorldPosition;
                varying vec3 vLocalPosition;

                float hash31(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
                float noise3(vec3 p) {
                    vec3 i = floor(p), f = fract(p);
                    f = f * f * (3.0 - 2.0 * f);
                    float n000 = hash31(i);
                    float n100 = hash31(i + vec3(1,0,0));
                    float n010 = hash31(i + vec3(0,1,0));
                    float n110 = hash31(i + vec3(1,1,0));
                    float n001 = hash31(i + vec3(0,0,1));
                    float n101 = hash31(i + vec3(1,0,1));
                    float n011 = hash31(i + vec3(0,1,1));
                    float n111 = hash31(i + vec3(1,1,1));
                    return mix(mix(mix(n000,n100,f.x), mix(n010,n110,f.x), f.y),
                               mix(mix(n001,n101,f.x), mix(n011,n111,f.x), f.y), f.z);
                }
                float fbm(vec3 p) {
                    float v = 0.0, a = 0.55;
                    for (int i = 0; i < 4; i++) { v += noise3(p) * a; p = p * 2.07 + 13.7; a *= 0.48; }
                    return v;
                }
                void main() {
                    vec3 sphere = normalize(vLocalPosition);
                    vec3 N = normalize(vWorldNormal);
                    vec3 L = normalize(sunDirection);
                    vec3 V = normalize(cameraPosition - vWorldPosition);
                    float broad = fbm(sphere * 5.5 + seed * 0.011);
                    float fine = fbm(sphere * 24.0 - seed * 0.017 + time * 0.002);
                    float fracture = 1.0 - smoothstep(0.035, 0.16, abs(fine - 0.52));
                    float basin = smoothstep(0.48, 0.72, broad);
                    float thermal = clamp((surfaceTemperatureK - 650.0) / 1500.0, 0.0, 1.0);
                    float day = smoothstep(-0.18, 0.16, dot(N, L));
                    float magma = clamp(fracture * (0.44 + thermal * 0.52) + basin * thermal * 0.28, 0.0, 1.0);
                    vec3 crust = mix(vec3(0.055, 0.045, 0.042), vec3(0.18, 0.075, 0.025), broad * 0.65);
                    vec3 lava = mix(vec3(0.92, 0.12, 0.008), vec3(1.0, 0.78, 0.18), pow(magma, 1.5));
                    float nightCooling = mix(0.42, 0.86, thermal);
                    vec3 color = mix(crust * mix(nightCooling, 1.0, day), lava, magma);
                    float rim = pow(1.0 - max(dot(N, V), 0.0), 3.0);
                    color += lava * magma * (0.48 + thermal * 0.65) + vec3(0.34, 0.06, 0.01) * rim * 0.18;
                    gl_FragColor = vec4(color, 1.0);
                }
            `
        };
    }

    getIceShader() {
        return {
            vShader: `
                varying vec3 vWorldNormal;
                varying vec3 vWorldPosition;
                varying vec3 vLocalPosition;
                void main() {
                    vec4 worldPos = modelMatrix * vec4(position, 1.0);
                    vWorldPosition = worldPos.xyz;
                    vWorldNormal = normalize(mat3(modelMatrix) * normal);
                    vLocalPosition = position;
                    gl_Position = projectionMatrix * viewMatrix * worldPos;
                }
            `,
            fShader: `
                uniform float seed;
                uniform float surfaceTemperatureK;
                uniform float waterPotential;
                uniform vec3 sunDirection;
                varying vec3 vWorldNormal;
                varying vec3 vWorldPosition;
                varying vec3 vLocalPosition;
                float h31(vec3 p) { return fract(sin(dot(p, vec3(41.7, 289.1, 113.5))) * 43758.5453); }
                float n3(vec3 p) {
                    vec3 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
                    float a=h31(i), b=h31(i+vec3(1,0,0)), c=h31(i+vec3(0,1,0)), d=h31(i+vec3(1,1,0));
                    float e=h31(i+vec3(0,0,1)), g=h31(i+vec3(1,0,1)), h=h31(i+vec3(0,1,1)), j=h31(i+vec3(1,1,1));
                    return mix(mix(mix(a,b,f.x),mix(c,d,f.x),f.y),mix(mix(e,g,f.x),mix(h,j,f.x),f.y),f.z);
                }
                void main() {
                    vec3 sphere = normalize(vLocalPosition);
                    vec3 N = normalize(vWorldNormal), L = normalize(sunDirection), V = normalize(cameraPosition - vWorldPosition);
                    float plate = n3(sphere * 7.0 + seed * 0.009);
                    float fiss = abs(n3(sphere * 31.0 - seed * 0.013) - 0.5);
                    float crack = 1.0 - smoothstep(0.018, 0.085, fiss);
                    float melt = smoothstep(250.0, 292.0, surfaceTemperatureK) * smoothstep(0.28, 0.72, plate) * waterPotential;
                    vec3 deepIce = vec3(0.20, 0.42, 0.58);
                    vec3 snowIce = vec3(0.78, 0.90, 0.98);
                    vec3 albedo = mix(deepIce, snowIce, 0.38 + plate * 0.52);
                    albedo = mix(albedo, vec3(0.035, 0.16, 0.24), melt * 0.68);
                    albedo = mix(albedo, vec3(0.08, 0.24, 0.34), crack * 0.55);
                    float ndl = max(dot(N,L),0.0);
                    vec3 H = normalize(L+V);
                    float spec = pow(max(dot(N,H),0.0), 96.0) * (0.28 + (1.0-melt)*0.30);
                    float fresnel = pow(1.0-max(dot(N,V),0.0),4.0);
                    vec3 color = albedo * (0.17 + ndl * 0.78) + vec3(0.65,0.86,1.0) * (spec + fresnel * 0.18);
                    gl_FragColor = vec4(color, 1.0);
                }
            `
        };
    }

    getGasShader() {
        return {
            vShader: `
                varying vec3 vWorldNormal;
                varying vec3 vWorldPosition;
                varying vec3 vLocalPosition;
                void main() {
                    vec4 worldPos = modelMatrix * vec4(position, 1.0);
                    vWorldPosition = worldPos.xyz;
                    vWorldNormal = normalize(mat3(modelMatrix) * normal);
                    vLocalPosition = position;
                    gl_Position = projectionMatrix * viewMatrix * worldPos;
                }
            `,
            fShader: `
                uniform float seed;
                uniform float time;
                uniform float surfaceTemperatureK;
                uniform float tidallyLocked;
                uniform vec3 sunDirection;
                uniform vec3 color1;
                uniform vec3 color2;
                uniform vec3 color3;
                varying vec3 vWorldNormal;
                varying vec3 vWorldPosition;
                varying vec3 vLocalPosition;
                float hash21(vec2 p) { return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
                float noise2(vec2 p) {
                    vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
                    return mix(mix(hash21(i),hash21(i+vec2(1,0)),f.x),mix(hash21(i+vec2(0,1)),hash21(i+vec2(1,1)),f.x),f.y);
                }
                void main() {
                    vec3 sphere = normalize(vLocalPosition);
                    vec3 N = normalize(vWorldNormal), L = normalize(sunDirection), V = normalize(cameraPosition - vWorldPosition);
                    float lat = asin(clamp(sphere.y,-1.0,1.0));
                    float lon = atan(sphere.z, sphere.x);
                    float jetNoise = noise2(vec2(lon * 3.0 + time * 0.012, lat * 7.0 + seed * 0.01));
                    float bands = 0.5 + 0.5 * sin(lat * 29.0 + jetNoise * 4.2 + sin(lat * 7.0) * 1.8);
                    float fineBands = 0.5 + 0.5 * sin(lat * 73.0 - time * 0.018 + jetNoise * 3.0);
                    float stormNoise = noise2(vec2(lon * 4.5 - time * 0.006, lat * 10.0));
                    float storm = smoothstep(0.78, 0.94, stormNoise) * smoothstep(0.1, 0.95, abs(cos(lat)));
                    vec3 color = mix(color1, color2, bands);
                    color = mix(color, color3, fineBands * 0.28 + storm * 0.38);
                    float dayMu = dot(N,L);
                    float day = smoothstep(-0.30, 0.16, dayMu);
                    float hot = clamp((surfaceTemperatureK - 700.0) / 1500.0, 0.0, 1.0);
                    float lockedNightCloud = tidallyLocked * (1.0 - day) * (0.12 + hot * 0.20);
                    color = mix(color * (0.30 + day * 0.70), vec3(0.58,0.62,0.70), lockedNightCloud);
                    float rim = pow(1.0 - max(dot(N,V),0.0), 2.6);
                    color += mix(vec3(0.10,0.18,0.28), color2, 0.35) * rim * 0.34;
                    gl_FragColor = vec4(color, 1.0);
                }
            `
        };
    }

    createPlanet(seed, type = 'planet', physicalProfile = null, renderOptions = {}) {
        const resolvedProfile = normalizePlanetPhysicalProfile(physicalProfile, seed, type);
        const meshDetail = ['low', 'medium', 'high', 'ultra'].includes(renderOptions?.meshDetail) ? renderOptions.meshDetail : 'high';
        const terrainDetailScale = terrainClamp(terrainNumber(renderOptions?.terrainDetailScale, 1), 0.55, 1.35);
        const rng = (s) => {
            const x = Math.sin(s++) * 10000;
            return x - Math.floor(x);
        };
        const r = rng(seed);

        let shaderData;
        const uniforms = {
            seed: { value: seed },
            time: { value: 0 },
            sunDirection: { value: new THREE.Vector3(1, 0.5, 1) },
            equilibriumTemperatureK: { value: resolvedProfile.equilibriumTemperatureK },
            surfaceTemperatureK: { value: resolvedProfile.estimatedSurfaceTemperatureK },
            waterPotential: { value: resolvedProfile.waterPotential },
            icePotential: { value: resolvedProfile.icePotential },
            atmosphereRetention: { value: resolvedProfile.atmosphereRetention },
            climateContrast: { value: resolvedProfile.climateContrast },
            tidallyLocked: { value: resolvedProfile.tidallyLocked ? 1 : 0 },
            terrainDetail: { value: terrainDetailScale }
        };

        if (type === 'lava' || type === 'volcanic') {
            shaderData = this.shaders.lava;
        } else if (type === 'ice' || type === 'frozen') {
            shaderData = this.shaders.ice;
        } else if (type === 'gas' || type === 'giant') {
            shaderData = this.shaders.gas;
            uniforms.color1 = { value: new THREE.Color().setHSL(r, 0.6, 0.4) };
            uniforms.color2 = { value: new THREE.Color().setHSL((r + 0.3) % 1, 0.5, 0.6) };
            uniforms.color3 = { value: new THREE.Color().setHSL((r + 0.6) % 1, 0.4, 0.3) };
        } else if (type === 'moon') {
            shaderData = this.shaders.standard;
            uniforms.colorWater = { value: new THREE.Color(0x333333) };
            uniforms.colorSand = { value: new THREE.Color(0x555555) };
            uniforms.colorGrass = { value: new THREE.Color(0x777777) };
            uniforms.colorRock = { value: new THREE.Color(0x999999) };
            uniforms.colorSnow = { value: new THREE.Color(0xcccccc) };
        } else {
            shaderData = this.shaders.standard;
            const t = resolvedProfile.estimatedSurfaceTemperatureK;
            const wet = resolvedProfile.waterPotential;
            const arid = resolvedProfile.aridity;
            // Mineral/ice/ocean palette is climate-conditioned; green is intentionally muted because
            // no vegetation is implied by catalog data alone.
            const lowland = t < 245 ? new THREE.Color(0x697784)
                : t > 360 ? new THREE.Color(0x9b6440)
                    : new THREE.Color(0x66745f).lerp(new THREE.Color(0x83725c), arid * 0.72);
            uniforms.colorWater = { value: new THREE.Color(0x075985).multiplyScalar(0.76 + wet * 0.27 + r * 0.08) };
            uniforms.colorSand = { value: new THREE.Color(t > 360 ? 0xc08355 : 0xb7a57d) };
            uniforms.colorGrass = { value: lowland.multiplyScalar(0.94 + rng(seed + 1) * 0.10) };
            uniforms.colorRock = { value: new THREE.Color(t > 520 ? 0x6f4c3b : 0x66635f) };
            uniforms.colorSnow = { value: new THREE.Color(0xe9f0f6) };
        }

        // Graphics quality controls tessellation without changing the deterministic height field
        // used by gameplay tiles. High is the new default; Ultra targets close-up photo mode.
        const meshSegments = ({ low: 80, medium: 112, high: 160, ultra: 256 })[meshDetail] || 160;
        const geometry = new THREE.SphereGeometry(50, meshSegments, meshSegments);

        // --- CPU DISPLACEMENT ---
        const isRockySurface = !['gas', 'giant'].includes(String(type || '').toLowerCase());
        if (isRockySurface) {
            const posAttr = geometry.attributes.position;
            const count = posAttr.count;
            for (let i = 0; i < count; i++) {
                const x = posAttr.getX(i);
                const y = posAttr.getY(i);
                const z = posAttr.getZ(i);

                // Normalized Coords
                const nx = x / 50; const ny = y / 50; const nz = z / 50;

                const disp = this.calculateHeight(nx, ny, nz, seed, resolvedProfile, type);

                // Displace
                posAttr.setX(i, x + nx * disp);
                posAttr.setY(i, y + ny * disp);
                posAttr.setZ(i, z + nz * disp);
            }
            geometry.computeVertexNormals();
        }

        const material = new THREE.ShaderMaterial({
            vertexShader: shaderData.vShader,
            fragmentShader: shaderData.fShader,
            uniforms: uniforms,
            dithering: true
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData = {
            isPlanet: true,
            uniforms: uniforms,
            terrain: {
                version: PLANET_TERRAIN_VERSION,
                provenance: resolvedProfile.provenance,
                physicalProfile: resolvedProfile,
                resolvedSurfaceData: false,
                meshDetail,
                meshSegments,
                terrainDetailScale,
                description: 'NASA-catalog-constrained deterministic terrain and reduced-order climate visualization; surface/climate fields are modeled scenarios, not observed exoplanet maps.'
            }
        };

        return mesh;
    }
}
window.PlanetGenerator = PlanetGenerator;
window.normalizePlanetPhysicalProfile = normalizePlanetPhysicalProfile;

const globalTerrainNoiseCache = new Map();
// Game logic uses the same terrain function as the rendered mesh, preventing tile/mesh drift.
window.getTerrainHeight = (x, y, z, seed, physicalProfile = null, type = 'planet') => {
    const numericSeed = terrainNumber(seed, 12345);
    if (!globalTerrainNoiseCache.has(numericSeed)) {
        globalTerrainNoiseCache.set(numericSeed, new SimpleNoise(numericSeed));
        if (globalTerrainNoiseCache.size > 12) {
            globalTerrainNoiseCache.delete(globalTerrainNoiseCache.keys().next().value);
        }
    }
    const profile = normalizePlanetPhysicalProfile(physicalProfile, numericSeed, type);
    return computePlanetTerrainHeight(x, y, z, numericSeed, profile, type, globalTerrainNoiseCache.get(numericSeed));
};
