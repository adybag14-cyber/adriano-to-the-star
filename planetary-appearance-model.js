(function (global) {
  'use strict';

  const MODEL_VERSION = 'ita-planetary-appearance-v1';
  const EARTH_DIAMETER_KM = 12742;

  const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, Number(value) || 0));
  const finite = value => {
    if (value === null || value === undefined || value === '') return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  };
  const normalise = value => String(value || '')
    .normalize('NFKD')
    .toLowerCase()
    .replace(/trappist/g, 'trappist')
    .replace(/[^a-z0-9]+/g, '');

  function hashText(value) {
    let hash = 2166136261;
    for (const character of String(value || 'planet')) {
      hash ^= character.charCodeAt(0);
      hash = Math.imul(hash, 16777619) >>> 0;
    }
    return hash >>> 0;
  }

  function seededRandom(seed) {
    let state = seed >>> 0 || 0x9e3779b9;
    return () => {
      state += 0x6d2b79f5;
      let value = state;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
  }

  const noiseFade = value => value * value * (3 - 2 * value);
  const noiseMix = (a, b, amount) => a + (b - a) * amount;

  function latticeNoise(x, y, z, seed) {
    let hash = seed >>> 0;
    hash ^= Math.imul(x, 0x1f123bb5);
    hash ^= Math.imul(y, 0x5f356495);
    hash ^= Math.imul(z, 0x6c8e9cf5);
    hash = Math.imul(hash ^ (hash >>> 16), 0x45d9f3b);
    hash = Math.imul(hash ^ (hash >>> 16), 0x45d9f3b);
    return ((hash ^ (hash >>> 16)) >>> 0) / 4294967295 * 2 - 1;
  }

  function valueNoise3(x, y, z, seed) {
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const z0 = Math.floor(z);
    const tx = noiseFade(x - x0);
    const ty = noiseFade(y - y0);
    const tz = noiseFade(z - z0);
    const x1 = x0 + 1;
    const y1 = y0 + 1;
    const z1 = z0 + 1;
    const n000 = latticeNoise(x0, y0, z0, seed);
    const n100 = latticeNoise(x1, y0, z0, seed);
    const n010 = latticeNoise(x0, y1, z0, seed);
    const n110 = latticeNoise(x1, y1, z0, seed);
    const n001 = latticeNoise(x0, y0, z1, seed);
    const n101 = latticeNoise(x1, y0, z1, seed);
    const n011 = latticeNoise(x0, y1, z1, seed);
    const n111 = latticeNoise(x1, y1, z1, seed);
    const lower = noiseMix(noiseMix(n000, n100, tx), noiseMix(n010, n110, tx), ty);
    const upper = noiseMix(noiseMix(n001, n101, tx), noiseMix(n011, n111, tx), ty);
    return noiseMix(lower, upper, tz);
  }

  function fractalNoise3(x, y, z, seed, octaves = 4) {
    let sum = 0;
    let weight = 0;
    let amplitude = 0.56;
    let frequency = 1;
    for (let octave = 0; octave < octaves; octave += 1) {
      sum += valueNoise3(x * frequency, y * frequency, z * frequency, seed + octave * 1013) * amplitude;
      weight += amplitude;
      amplitude *= 0.5;
      frequency *= 2.03;
    }
    return sum / Math.max(0.001, weight);
  }

  function datum(primary, composite, key) {
    const direct = primary?.measurements?.[key];
    if (finite(direct?.value) !== null) return direct;
    const filled = composite?.measurements?.[key];
    if (finite(filled?.value) !== null) return filled;
    return direct || filled || null;
  }

  function formatNumber(value, maximumFractionDigits = 2) {
    const number = finite(value);
    return number === null ? 'Unreported' : number.toLocaleString(undefined, { maximumFractionDigits });
  }

  function mixColour(a, b, amount) {
    const t = clamp(amount, 0, 1);
    return [0, 1, 2].map(index => Math.round(a[index] + (b[index] - a[index]) * t));
  }

  function rgbCss(colour) {
    return `rgb(${colour[0]}, ${colour[1]}, ${colour[2]})`;
  }

  class PlanetaryAppearanceModel {
    constructor(catalog = null) {
      this.catalog = null;
      this.systemIndex = new Map();
      this.planetIndex = new Map();
      this.setCatalog(catalog);
    }

    setCatalog(catalog) {
      this.catalog = catalog && Array.isArray(catalog.systems) ? catalog : { systems: [] };
      this.systemIndex.clear();
      this.planetIndex.clear();
      for (const system of this.catalog.systems) {
        const systemAliases = [system.id, system.hostname];
        if (/^proxima cen$/i.test(system.hostname || '')) systemAliases.push('Proxima Centauri');
        if (/^barnard'?s star$/i.test(system.hostname || '')) systemAliases.push("Barnard's Star", 'Barnard Star');
        if (/^eps eri$/i.test(system.hostname || '')) systemAliases.push('Epsilon Eridani');
        for (const alias of systemAliases) this.systemIndex.set(normalise(alias), system);
        for (const planet of system.planets || []) {
          const aliases = [planet.id, planet.name, `${system.hostname} ${planet.letter || ''}`];
          aliases.push(String(planet.name || '').replace(/\s+([a-z])$/i, '$1'));
          if (/^TRAPPIST-1 /i.test(planet.name || '')) aliases.push(String(planet.name).replace('TRAPPIST-1 ', 'Trappist-1'));
          if (/^Kepler-/i.test(planet.name || '')) aliases.push(String(planet.name).replace(/\s+([a-z])$/i, '$1'));
          for (const alias of aliases) this.planetIndex.set(normalise(alias), { system, planet });
        }
      }
      return this;
    }

    resolveSystem(query) {
      return this.systemIndex.get(normalise(query)) || null;
    }

    resolvePlanet(query) {
      return this.planetIndex.get(normalise(query)) || null;
    }

    resolveTarget(query) {
      const planet = this.resolvePlanet(query);
      if (planet) return planet;
      const system = this.resolveSystem(query);
      if (!system || !(system.planets || []).length) return null;
      return { system, planet: system.planets[0], resolvedFromSystem: true };
    }

    listSystemPlanets(query) {
      const match = this.resolvePlanet(query);
      const system = match?.system || this.resolveSystem(query);
      return system ? [...(system.planets || [])] : [];
    }

    derive(target) {
      const resolved = target?.planet ? target : this.resolveTarget(target);
      if (!resolved) return null;
      const { system, planet } = resolved;
      const primary = planet.psDefault || {};
      const composite = planet.psComposite || {};
      const massDatum = datum(primary, composite, 'massEarth');
      const radiusDatum = datum(primary, composite, 'radiusEarth');
      const temperatureDatum = datum(primary, composite, 'equilibriumTemperatureK');
      const insolationDatum = datum(primary, composite, 'insolationEarth');
      const periodDatum = datum(primary, composite, 'orbitalPeriodDays');
      const axisDatum = datum(primary, composite, 'semiMajorAxisAu');
      const densityDatum = datum(primary, composite, 'densityGcm3');
      const massEarth = finite(massDatum?.value);
      let radiusEarth = finite(radiusDatum?.value);
      const assumptions = [];
      if (radiusEarth === null && massEarth !== null) {
        radiusEarth = clamp(Math.pow(Math.max(0.02, massEarth), 0.279), 0.18, 4.5);
        assumptions.push('Radius estimated from a rocky-world mass-radius prior because no archive radius is reported.');
      }
      if (radiusEarth === null) {
        radiusEarth = 1;
        assumptions.push('Display radius is normalised because neither radius nor a usable mass is reported.');
      }
      const equilibriumTemperatureK = finite(temperatureDatum?.value)
        ?? (finite(insolationDatum?.value) !== null ? 255 * Math.pow(Math.max(0.001, insolationDatum.value), 0.25) : 300);
      if (finite(temperatureDatum?.value) === null) assumptions.push('Equilibrium temperature uses a zero-dimensional irradiation prior.');
      const gravityEarth = massEarth === null ? null : massEarth / Math.max(0.02, radiusEarth * radiusEarth);
      const retention = gravityEarth === null
        ? 0.22
        : clamp(gravityEarth * Math.sqrt(288 / Math.max(80, equilibriumTemperatureK)) * 0.55, 0.02, 1.35);
      const spectrumCounts = planet.spectroscopy?.counts || {};
      const spectraCount = ['transmission', 'eclipse', 'directImaging']
        .reduce((sum, key) => sum + (finite(spectrumCounts[key]) || 0), 0);
      const species = planet.spectroscopy?.species?.values || [];
      const hasRetrievedSpecies = species.some(item => /detected|retrieved/i.test(item?.status || ''));
      const evidenceClass = hasRetrievedSpecies
        ? 'spectrum-constrained'
        : massEarth !== null || finite(radiusDatum?.value) !== null || finite(temperatureDatum?.value) !== null
          ? 'bulk-constrained'
          : 'illustrative';
      const evidenceLabel = evidenceClass === 'spectrum-constrained'
        ? 'Spectrum-constrained realization'
        : evidenceClass === 'bulk-constrained'
          ? 'Bulk-property-constrained hypothesis'
          : 'Illustrative — physical inputs incomplete';
      const spectrumStatus = spectraCount > 0
        ? `${spectraCount} archived planetary spectrum metadata record${spectraCount === 1 ? '' : 's'}; species are not supplied by NASA TAP.`
        : 'No planetary atmospheric spectrum is archived for this world.';
      if (!hasRetrievedSpecies) assumptions.push('Atmospheric composition is unconstrained; no species are assigned from the host star spectrum.');
      assumptions.push('Surface geography and cloud placement are deterministic procedural assumptions, not resolved observations.');

      const isGiant = radiusEarth >= 5 || (massEarth !== null && massEarth >= 35);
      const isSubNeptune = !isGiant && (radiusEarth >= 1.7 || (massEarth !== null && massEarth >= 8));
      const hot = equilibriumTemperatureK >= 500;
      const warm = equilibriumTemperatureK >= 310;
      const cold = equilibriumTemperatureK < 230;
      const seed = hashText(`${planet.id}:${this.catalog.generatedAt || 'snapshot'}:${MODEL_VERSION}`);
      const palette = isGiant
        ? [[34, 44, 58], [126, 102, 78], [214, 180, 130], [78, 101, 126]]
        : isSubNeptune
          ? [[20, 45, 60], [49, 102, 125], [155, 191, 190], [225, 225, 207]]
          : hot
            ? [[24, 18, 20], [84, 39, 29], [166, 83, 39], [218, 151, 80]]
            : warm
              ? [[21, 24, 29], [69, 62, 54], [128, 98, 70], [184, 144, 94]]
              : cold
                ? [[17, 25, 34], [55, 79, 96], [126, 151, 162], [213, 225, 225]]
                : [[16, 24, 30], [40, 73, 69], [91, 103, 70], [153, 138, 95]];
      const surfaceClass = isGiant ? 'Atmospheric photosphere scenario'
        : isSubNeptune ? 'Volatile-rich atmosphere scenario'
          : hot ? 'Hot rocky / oxidised mineral scenario'
            : warm ? 'Warm rocky / basaltic scenario'
              : cold ? 'Cold rocky / volatile frost scenario'
                : 'Temperate rocky scenario';
      const atmosphereOpacity = isGiant ? 0.42 : isSubNeptune ? 0.34 : clamp(retention * 0.16, 0.015, 0.19);
      const cloudOpacity = isGiant ? 0.64 : isSubNeptune ? 0.42 : clamp((retention - 0.45) * 0.27, 0, 0.18);
      const atmosphereColour = hot ? [238, 112, 63]
        : warm ? [201, 151, 103]
          : cold ? [139, 194, 222]
            : [101, 188, 211];
      const measuredRadius = finite(primary.measurements?.radiusEarth?.value) !== null;
      const radiusKind = measuredRadius ? 'published default solution'
        : radiusDatum?.provenance?.kind === 'archive-calculated' ? 'archive-calculated' : 'model prior';
      const massQualifier = /msini/i.test(primary.massProvenance || composite.massProvenance || '') ? 'minimum mass (M sin i)' : 'mass';

      const references = [
        planet.discovery?.reference,
        primary.references?.planet,
        radiusDatum?.provenance?.reference,
        massDatum?.provenance?.reference
      ].filter((item, index, all) => item?.url && all.findIndex(candidate => candidate?.url === item.url) === index);
      return {
        modelVersion: MODEL_VERSION,
        planetId: planet.id,
        planetName: planet.name,
        hostname: system.hostname,
        systemId: system.id,
        generatedFromSnapshot: this.catalog.generatedAt || null,
        seed,
        record: planet,
        system,
        physical: {
          radiusEarth,
          radiusKind,
          massEarth,
          massQualifier,
          gravityEarth,
          equilibriumTemperatureK,
          insolationEarth: finite(insolationDatum?.value),
          orbitalPeriodDays: finite(periodDatum?.value),
          semiMajorAxisAu: finite(axisDatum?.value),
          densityGcm3: finite(densityDatum?.value)
        },
        evidence: {
          class: evidenceClass,
          label: evidenceLabel,
          spectrumStatus,
          spectraCount,
          speciesStatus: planet.spectroscopy?.species?.status || 'unreported',
          species,
          confidence: hasRetrievedSpecies ? 'retrieval-dependent' : evidenceClass === 'bulk-constrained' ? 'low — atmosphere unconstrained' : 'illustrative',
          spatialConstraint: 'none',
          assumptions
        },
        appearance: {
          surfaceClass,
          palette,
          atmosphereColour,
          atmosphereOpacity,
          cloudOpacity,
          banding: isGiant || isSubNeptune,
          craterStrength: isGiant || isSubNeptune ? 0 : clamp(1 - retention * 0.55, 0.22, 0.95),
          roughness: isGiant ? 0.28 : 0.82
        },
        sources: references,
        data: {
          name: String(planet.name || '').toUpperCase(),
          diameter: `${formatNumber(radiusEarth * EARTH_DIAMETER_KM, 0)} km (${radiusKind})`,
          distance: system.distancePc == null ? 'Distance unreported' : `${formatNumber(system.distancePc * 3.26156, 2)} light-years`,
          surface: surfaceClass,
          desc: `${evidenceLabel}. ${spectrumStatus} This is one physically compatible visual scenario, not a resolved photograph.`
        }
      };
    }

    createSurfaceTexture(THREE, model, options = {}) {
      if (!THREE || !model) return null;
      const width = Math.max(512, Number(options.width) || 1024);
      const height = Math.max(256, Number(options.height) || Math.round(width / 2));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d', { alpha: false });
      if (!context) return null;
      const image = context.createImageData(width, height);
      const data = image.data;
      const random = seededRandom(model.seed);
      const phase = random() * Math.PI * 2;
      const palette = model.appearance.palette;
      const craters = Array.from({ length: Math.round(4 + model.appearance.craterStrength * 7) }, () => {
        const z = random() * 2 - 1;
        const angle = random() * Math.PI * 2;
        const radius = Math.sqrt(Math.max(0, 1 - z * z));
        return { x: radius * Math.cos(angle), y: z, z: radius * Math.sin(angle), size: 0.025 + random() * 0.095 };
      });
      let offset = 0;
      for (let y = 0; y < height; y += 1) {
        const latitude = (0.5 - (y + 0.5) / height) * Math.PI;
        const cosLatitude = Math.cos(latitude);
        const sy = Math.sin(latitude);
        for (let x = 0; x < width; x += 1) {
          const longitude = ((x + 0.5) / width - 0.5) * Math.PI * 2;
          const sx = cosLatitude * Math.cos(longitude);
          const sz = cosLatitude * Math.sin(longitude);
          const warp = valueNoise3(sx * 1.55 + 13.7, sy * 1.55 - 4.2, sz * 1.55 + 8.9, model.seed + 17);
          let wx = sx + warp * 0.21;
          let wy = sy + warp * 0.13;
          let wz = sz - warp * 0.17;
          const warpedLength = Math.hypot(wx, wy, wz) || 1;
          wx /= warpedLength;
          wy /= warpedLength;
          wz /= warpedLength;
          const broad = fractalNoise3(wx * 1.85, wy * 1.85, wz * 1.85, model.seed + 73, 3);
          const ridgeSample = fractalNoise3(wx * 5.4, wy * 5.4, wz * 5.4, model.seed + 137, 2);
          const ridge = 1 - Math.abs(ridgeSample);
          let value = clamp(0.42 + broad * 0.42 + ridge * 0.22, 0, 1);
          if (model.appearance.banding) {
            const belts = Math.sin(latitude * 18 + broad * 2.8 + phase) * 0.5 + 0.5;
            value = clamp(value * 0.48 + belts * 0.52, 0, 1);
          } else {
            for (const crater of craters) {
              const distance = Math.sqrt(Math.max(0, 2 - 2 * clamp(sx * crater.x + sy * crater.y + sz * crater.z, -1, 1)));
              if (distance < crater.size) value -= (1 - distance / crater.size) * 0.22 * model.appearance.craterStrength;
              else if (distance < crater.size * 1.18) value += 0.08 * (1 - (distance - crater.size) / (crater.size * 0.18));
            }
          }
          value = clamp(value, 0, 0.999);
          const scaled = value * (palette.length - 1);
          const index = Math.min(palette.length - 2, Math.floor(scaled));
          const colour = mixColour(palette[index], palette[index + 1], scaled - index);
          const polarFrost = model.physical.equilibriumTemperatureK < 260
            ? clamp((Math.abs(sy) - 0.72) * 3.5, 0, 0.72)
            : 0;
          const finalColour = polarFrost ? mixColour(colour, [218, 230, 231], polarFrost) : colour;
          data[offset++] = finalColour[0];
          data[offset++] = finalColour[1];
          data[offset++] = finalColour[2];
          data[offset++] = 255;
        }
      }
      context.putImageData(image, 0, 0);
      const texture = new THREE.CanvasTexture(canvas);
      texture.name = `${MODEL_VERSION}:${model.planetId}:surface`;
      texture.userData = {
        modelVersion: MODEL_VERSION,
        planetId: model.planetId,
        evidenceClass: model.evidence.class,
        spatialConstraint: 'none',
        generatedFromSnapshot: model.generatedFromSnapshot
      };
      return texture;
    }

    createCloudTexture(THREE, model, options = {}) {
      if (!THREE || !model || model.appearance.cloudOpacity <= 0.01) return null;
      const width = Math.max(512, Number(options.width) || 1024);
      const height = Math.max(256, Number(options.height) || Math.round(width / 2));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d');
      if (!context) return null;
      const image = context.createImageData(width, height);
      const pixels = image.data;
      const phase = (model.seed % 4096) / 4096 * Math.PI * 2;
      let offset = 0;
      for (let y = 0; y < height; y += 1) {
        const latitude = (0.5 - (y + 0.5) / height) * Math.PI;
        const cy = Math.sin(latitude);
        const radial = Math.cos(latitude);
        for (let x = 0; x < width; x += 1) {
          const longitude = ((x + 0.5) / width - 0.5) * Math.PI * 2;
          const cx = radial * Math.cos(longitude);
          const cz = radial * Math.sin(longitude);
          const field = Math.sin(cx * 34 + cy * 19 + cz * 27 + phase)
            + 0.55 * Math.cos(cx * 71 - cy * 43 + cz * 37 - phase * 0.6)
            + 0.28 * Math.sin(cx * 137 + cy * 89 - cz * 61 + phase * 1.8);
          const alpha = clamp((field - 0.48) * 130, 0, 180);
          pixels[offset++] = 225;
          pixels[offset++] = 235;
          pixels[offset++] = 238;
          pixels[offset++] = alpha;
        }
      }
      context.putImageData(image, 0, 0);
      const texture = new THREE.CanvasTexture(canvas);
      texture.name = `${MODEL_VERSION}:${model.planetId}:clouds`;
      return texture;
    }

    toViewerConfig(target) {
      const model = target?.modelVersion ? target : this.derive(target);
      if (!model) return null;
      return {
        texture: null,
        color: 0xffffff,
        speed: 0.00055,
        size: 1,
        planetaryModel: model,
        data: model.data
      };
    }

    describeColour(model) {
      return model ? rgbCss(model.appearance.atmosphereColour) : 'transparent';
    }
  }

  PlanetaryAppearanceModel.MODEL_VERSION = MODEL_VERSION;
  global.PlanetaryAppearanceModel = PlanetaryAppearanceModel;
})(window);
