#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, '..');
const argument = name => process.argv.find(value => value.startsWith(`--${name}=`))?.slice(name.length + 3);
const inputPath = path.resolve(repositoryRoot, argument('input') || 'data/exoplanet-atmospheres.json');
const outputPath = path.resolve(repositoryRoot, argument('output') || 'data/exoplanet-appearance-index.json');
const coreOutputPath = path.resolve(repositoryRoot, argument('core-output') || 'data/exoplanet-appearance-core.json');
const dryRun = process.argv.includes('--check');
const CORE_HOSTS = new Set([
  'Proxima Cen',
  "Barnard's star",
  'eps Eri',
  'tau Cet',
  'TRAPPIST-1',
  'Kepler-186',
  'Kepler-452',
  'TOI-700'
]);

const MEASUREMENT_KEYS = [
  'radiusEarth',
  'massEarth',
  'orbitalPeriodDays',
  'semiMajorAxisAu',
  'eccentricity',
  'insolationEarth',
  'equilibriumTemperatureK',
  'densityGcm3'
];

function compactMeasurement(measurement) {
  if (!measurement || typeof measurement !== 'object') return null;
  return {
    value: measurement.value ?? null,
    display: measurement.display ?? null,
    unit: measurement.unit || null,
    provenance: {
      kind: measurement.provenance?.kind || 'unreported'
    }
  };
}

function compactMeasurements(measurements) {
  return Object.fromEntries(MEASUREMENT_KEYS
    .map(key => [key, compactMeasurement(measurements?.[key])])
    .filter(([, measurement]) => measurement?.value !== null));
}

const source = JSON.parse(await fs.readFile(inputPath, 'utf8'));
const index = {
  schemaVersion: 1,
  generatedAt: source.generatedAt,
  sourceArtifact: 'data/exoplanet-atmospheres.json',
  purpose: 'Compact browser runtime index. The full normalized measurements, literature references, spectra metadata, queries, and provenance remain in the source artifact.',
  scope: source.scope,
  updatePolicy: source.updatePolicy,
  sources: (source.sources || []).map(item => ({
    id: item.id,
    table: item.table,
    name: item.name,
    url: item.url,
    documentationUrl: item.documentationUrl,
    doi: item.doi || null,
    retrievedAt: item.retrievedAt
  })),
  statistics: source.statistics,
  systems: (source.systems || []).map(system => ({
    id: system.id,
    hostname: system.hostname,
    distancePc: system.distancePc,
    host: {
      spectralType: system.host?.spectralType || null,
      effectiveTemperatureK: system.host?.psDefault?.measurements?.effectiveTemperatureK?.value
        ?? system.host?.psComposite?.measurements?.effectiveTemperatureK?.value
        ?? null
    },
    planets: (system.planets || []).map(planet => ({
      id: planet.id,
      name: planet.name,
      letter: planet.letter,
      discovery: {
        method: planet.discovery?.method || null,
        year: planet.discovery?.year ?? null,
        reference: planet.discovery?.reference || null
      },
      psDefault: {
        archiveUpdated: planet.psDefault?.archiveUpdated || null,
        massProvenance: planet.psDefault?.massProvenance || null,
        measurements: compactMeasurements(planet.psDefault?.measurements)
      },
      psComposite: {
        massProvenance: planet.psComposite?.massProvenance || null,
        calculatedFields: planet.psComposite?.calculatedFields || [],
        measurements: compactMeasurements(planet.psComposite?.measurements)
      },
      spectroscopy: {
        counts: planet.spectroscopy?.counts || { transmission: 0, eclipse: 0, directImaging: 0 },
        metadataRecords: planet.spectroscopy?.spectra?.length || 0,
        species: planet.spectroscopy?.species || { status: 'not-provided-by-nasa-tap-metadata', values: [] }
      }
    }))
  }))
};

const planets = index.systems.flatMap(system => system.planets);
if (index.systems.length < 200 || planets.length < 350) throw new Error('Appearance index source is unexpectedly incomplete');
if (index.statistics?.systems !== index.systems.length || index.statistics?.planets !== planets.length) {
  throw new Error('Appearance index statistics do not match the projected records');
}
if (planets.some(planet => planet.spectroscopy.species.values.length !== 0)) {
  throw new Error('Appearance index must not introduce atmospheric species claims');
}
const barnard = index.systems.find(system => system.hostname === "Barnard's star");
if (JSON.stringify((barnard?.planets || []).map(planet => planet.name).sort()) !== JSON.stringify(['Barnard b', 'Barnard c', 'Barnard d', 'Barnard e'])) {
  throw new Error('Appearance index is missing the four Barnard planets');
}

const serialised = `${JSON.stringify(index)}\n`;
const serialisedBytes = Buffer.byteLength(serialised);
if (serialisedBytes >= 1024 * 1024) throw new Error(`Appearance index exceeds its 1 MiB runtime budget (${serialisedBytes} bytes)`);
const coreSystems = index.systems.filter(system => CORE_HOSTS.has(system.hostname));
const corePlanets = coreSystems.flatMap(system => system.planets);
const coreIndex = {
  ...index,
  purpose: 'Fast Planetary OS teaching-target index. Unknown targets fall back to the complete compact browser index.',
  statistics: {
    ...index.statistics,
    systems: coreSystems.length,
    planets: corePlanets.length,
    fullCatalogSystems: index.statistics.systems,
    fullCatalogPlanets: index.statistics.planets
  },
  systems: coreSystems
};
const coreSerialised = `${JSON.stringify(coreIndex)}\n`;
const coreSerialisedBytes = Buffer.byteLength(coreSerialised);
if (coreSystems.length !== CORE_HOSTS.size || corePlanets.length < 20) throw new Error('Appearance core is missing a required teaching system');
if (coreSerialisedBytes >= 128 * 1024) throw new Error(`Appearance core exceeds its 128 KiB startup budget (${coreSerialisedBytes} bytes)`);
if (dryRun) {
  console.log(`Appearance indexes valid: ${index.systems.length} systems / ${planets.length} planets / ${serialisedBytes} bytes; core ${coreSystems.length} systems / ${corePlanets.length} planets / ${coreSerialisedBytes} bytes.`);
} else {
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  const temporaryPath = `${outputPath}.${process.pid}.tmp`;
  const coreTemporaryPath = `${coreOutputPath}.${process.pid}.tmp`;
  await fs.writeFile(temporaryPath, serialised, 'utf8');
  await fs.writeFile(coreTemporaryPath, coreSerialised, 'utf8');
  await fs.rename(temporaryPath, outputPath);
  await fs.rename(coreTemporaryPath, coreOutputPath);
  console.log(`Wrote ${path.relative(repositoryRoot, outputPath)} (${serialisedBytes} bytes) and ${path.relative(repositoryRoot, coreOutputPath)} (${coreSerialisedBytes} bytes).`);
}
