#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, '..');
const outputArgument = process.argv.find(argument => argument.startsWith('--output='));
const outputPath = path.resolve(
  repositoryRoot,
  outputArgument?.slice('--output='.length) || 'data/exoplanet-atmospheres.json'
);
const dryRun = process.argv.includes('--check');

const TAP_BASE = 'https://exoplanetarchive.ipac.caltech.edu/TAP/sync';
const ARCHIVE_BASE = 'https://exoplanetarchive.ipac.caltech.edu/';
const NEARBY_DISTANCE_PC = 25;
const INCLUDED_HOST_OVERRIDES = ['TRAPPIST-1', 'Kepler-186', 'Kepler-452', 'TOI-700'];
const REQUIRED_BARNARD_PLANETS = ['Barnard b', 'Barnard c', 'Barnard d', 'Barnard e'];

const PLANET_MEASUREMENTS = [
  { key: 'radiusEarth', column: 'pl_rade', unit: 'earth-radius' },
  { key: 'massEarth', column: 'pl_bmasse', unit: 'earth-mass' },
  { key: 'orbitalPeriodDays', column: 'pl_orbper', unit: 'day' },
  { key: 'semiMajorAxisAu', column: 'pl_orbsmax', unit: 'au' },
  { key: 'eccentricity', column: 'pl_orbeccen', unit: 'dimensionless' },
  { key: 'insolationEarth', column: 'pl_insol', unit: 'earth-flux' },
  { key: 'equilibriumTemperatureK', column: 'pl_eqt', unit: 'kelvin' },
  { key: 'densityGcm3', column: 'pl_dens', unit: 'gram-per-cubic-centimetre' }
];

const STELLAR_MEASUREMENTS = [
  { key: 'effectiveTemperatureK', column: 'st_teff', unit: 'kelvin' },
  { key: 'radiusSolar', column: 'st_rad', unit: 'solar-radius' },
  { key: 'massSolar', column: 'st_mass', unit: 'solar-mass' },
  { key: 'luminosityLogSolar', column: 'st_lum', unit: 'log10-solar-luminosity' },
  { key: 'metallicityDex', column: 'st_met', unit: 'dex' }
];

const PS_BASE_COLUMNS = [
  'pl_name', 'hostname', 'pl_letter', 'ra', 'dec', 'sy_dist', 'st_spectype',
  'discoverymethod', 'disc_year', 'disc_refname', 'disc_facility', 'disc_telescope',
  'disc_instrument', 'rowupdate', 'releasedate', 'pl_pubdate', 'pl_refname',
  'st_refname', 'sy_refname', 'pl_nespec', 'pl_ntranspec', 'pl_ndispec'
];

const PSCOMP_BASE_COLUMNS = [
  'pl_name', 'hostname', 'pl_letter', 'ra', 'dec', 'sy_dist', 'sy_dist_reflink',
  'st_spectype', 'st_spectype_reflink', 'discoverymethod', 'disc_year',
  'disc_refname', 'disc_facility', 'disc_telescope', 'disc_instrument',
  'pl_nespec', 'pl_ntranspec', 'pl_ndispec'
];

const SPECTRA_COLUMNS = [
  'pl_name', 'spec_type', 'authors', 'num_datapoints', 'instrument', 'facility',
  'mintranmid', 'maxtranmid', 'minwavelng', 'maxwavelng', 'note', 'bibcode', 'spec_path'
];

function measurementColumns(specifications, includeReference) {
  return specifications.flatMap(({ column }) => [
    column,
    `${column}err1`,
    `${column}err2`,
    `${column}lim`,
    `${column}str`,
    ...(includeReference ? [`${column}_reflink`] : [])
  ]);
}

function unique(values) {
  return [...new Set(values)];
}

function quoteAdql(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

const hostOverrideList = INCLUDED_HOST_OVERRIDES.map(quoteAdql).join(',');
const scopePredicate = `(sy_dist<${NEARBY_DISTANCE_PC} or hostname in (${hostOverrideList}))`;
const psColumns = unique([
  ...PS_BASE_COLUMNS,
  ...measurementColumns(PLANET_MEASUREMENTS, false),
  ...measurementColumns(STELLAR_MEASUREMENTS, false),
  'pl_bmassprov'
]);
const psCompColumns = unique([
  ...PSCOMP_BASE_COLUMNS,
  ...measurementColumns(PLANET_MEASUREMENTS, true),
  ...measurementColumns(STELLAR_MEASUREMENTS, true),
  'pl_bmassprov'
]);

const psQuery = `select ${psColumns.join(',')} from ps where default_flag=1 and ${scopePredicate} order by sy_dist,hostname,pl_name`;
const psCompQuery = `select ${psCompColumns.join(',')} from pscomppars where ${scopePredicate} order by sy_dist,hostname,pl_name`;
const spectraQuery = `select ${SPECTRA_COLUMNS.join(',')} from spectra order by pl_name,spec_type,bibcode`;

function decodeEntities(value) {
  return String(value)
    .replace(/&plusmn;?/gi, '±')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&apos;|&#39;/gi, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_match, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#([0-9]+);/g, (_match, decimal) => String.fromCodePoint(Number.parseInt(decimal, 10)));
}

function normaliseText(value) {
  if (value === null || value === undefined) return null;
  const text = decodeEntities(value)
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return text || null;
}

function finite(value, digits = null) {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  return digits === null ? number : Number(number.toFixed(digits));
}

function integer(value) {
  const number = finite(value);
  return number === null ? null : Math.trunc(number);
}

function slug(value) {
  return String(value)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function normaliseIdentity(value) {
  return normaliseText(value)?.toLowerCase() || '';
}

function extractAttribute(html, attribute) {
  if (!html) return null;
  const pattern = new RegExp(`\\b${attribute}=(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i');
  const match = String(html).match(pattern);
  return match ? (match[1] || match[2] || match[3] || null) : null;
}

function resolveArchiveUrl(value) {
  const text = normaliseText(value);
  if (!text) return null;
  try {
    return new URL(text, ARCHIVE_BASE).href;
  } catch (_error) {
    return null;
  }
}

function parseReference(value) {
  if (!value) return null;
  const id = normaliseText(extractAttribute(value, 'refstr'));
  const url = resolveArchiveUrl(extractAttribute(value, 'href'));
  const label = normaliseText(value);
  if (!id && !url && !label) return null;
  return { id, label, url };
}

function referenceIsCalculated(reference) {
  return reference?.id === 'CALCULATED_VALUE' || /\bcalculated value\b/i.test(reference?.label || '');
}

async function queryTap(query) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(new Error('NASA TAP request timed out')), 60_000);
  try {
    const url = new URL(TAP_BASE);
    url.searchParams.set('query', query);
    url.searchParams.set('format', 'json');
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'adrianotothestar-atmosphere-snapshot/1.0 (+https://adrianotothestar.com/education.html)'
      },
      signal: controller.signal
    });
    if (!response.ok) throw new Error(`NASA TAP returned HTTP ${response.status}`);
    const rows = await response.json();
    if (!Array.isArray(rows)) throw new Error('NASA TAP did not return a JSON array');
    return rows;
  } finally {
    clearTimeout(timeout);
  }
}

function makeMeasurement(row, specification, table, fallbackReference) {
  const { key, column, unit } = specification;
  const value = finite(row?.[column]);
  const reference = table === 'pscomppars'
    ? parseReference(row?.[`${column}_reflink`])
    : fallbackReference;
  const kind = value === null
    ? 'unreported'
    : table === 'ps'
      ? 'default-parameter-set'
      : referenceIsCalculated(reference)
        ? 'archive-calculated'
        : 'literature';
  return [key, {
    value,
    errorPlus: finite(row?.[`${column}err1`]),
    errorMinus: finite(row?.[`${column}err2`]),
    limit: integer(row?.[`${column}lim`]),
    display: normaliseText(row?.[`${column}str`]),
    unit,
    provenance: { table, kind, reference }
  }];
}

function makeMeasurements(row, specifications, table, fallbackReference) {
  return Object.fromEntries(
    specifications.map(specification => makeMeasurement(row, specification, table, fallbackReference))
  );
}

function calculatedFields(measurements) {
  return Object.entries(measurements)
    .filter(([, measurement]) => measurement.provenance.kind === 'archive-calculated')
    .map(([key]) => key);
}

function makeTextDatum(value, table, referenceValue) {
  const text = normaliseText(value);
  const reference = parseReference(referenceValue);
  return {
    value: text,
    provenance: {
      table,
      kind: text === null
        ? 'unreported'
        : table === 'ps'
          ? 'default-parameter-set'
          : referenceIsCalculated(reference)
            ? 'archive-calculated'
            : 'literature',
      reference
    }
  };
}

function spectroscopyCounts(row) {
  return {
    transmission: integer(row?.pl_ntranspec),
    eclipse: integer(row?.pl_nespec),
    directImaging: integer(row?.pl_ndispec)
  };
}

function spectrumFromRow(row) {
  const bibcode = normaliseText(row.bibcode);
  return {
    type: normaliseText(row.spec_type),
    bibcode,
    authors: normaliseText(row.authors),
    referenceUrl: bibcode ? `https://ui.adsabs.harvard.edu/abs/${encodeURIComponent(bibcode)}/abstract` : null,
    numDatapoints: integer(row.num_datapoints),
    instrument: normaliseText(row.instrument),
    facility: normaliseText(row.facility),
    minObservationBjd: finite(row.mintranmid),
    maxObservationBjd: finite(row.maxtranmid),
    minWavelengthMicron: finite(row.minwavelng),
    maxWavelengthMicron: finite(row.maxwavelng),
    note: normaliseText(row.note),
    specPath: normaliseText(row.spec_path)
  };
}

function makeDiscovery(row) {
  return {
    method: normaliseText(row?.discoverymethod),
    year: integer(row?.disc_year),
    facility: normaliseText(row?.disc_facility),
    telescope: normaliseText(row?.disc_telescope),
    instrument: normaliseText(row?.disc_instrument),
    reference: parseReference(row?.disc_refname)
  };
}

function makePsDefault(row) {
  if (!row) return null;
  const references = {
    planet: parseReference(row.pl_refname),
    stellar: parseReference(row.st_refname),
    system: parseReference(row.sy_refname)
  };
  const measurements = makeMeasurements(row, PLANET_MEASUREMENTS, 'ps', references.planet);
  return {
    selection: 'default_flag=1',
    archiveUpdated: normaliseText(row.rowupdate),
    releaseDate: normaliseText(row.releasedate),
    publicationDate: normaliseText(row.pl_pubdate),
    references,
    massProvenance: normaliseText(row.pl_bmassprov),
    measurements
  };
}

function makePsComposite(row) {
  if (!row) return null;
  const measurements = makeMeasurements(row, PLANET_MEASUREMENTS, 'pscomppars', null);
  return {
    massProvenance: normaliseText(row.pl_bmassprov),
    measurements,
    calculatedFields: calculatedFields(measurements)
  };
}

function assertFiniteOrNull(value, pathLabel) {
  if (value !== null && !Number.isFinite(value)) throw new Error(`${pathLabel} must be finite or null`);
}

function validateSnapshot(snapshot) {
  if (snapshot.schemaVersion !== 1) throw new Error('Atmosphere snapshot schemaVersion must be 1');
  if (!Array.isArray(snapshot.systems) || snapshot.systems.length < 200) {
    throw new Error(`Refusing atmosphere snapshot with only ${snapshot.systems?.length || 0} systems`);
  }
  const planets = snapshot.systems.flatMap(system => system.planets || []);
  if (planets.length < 350) throw new Error(`Refusing atmosphere snapshot with only ${planets.length} planets`);
  const planetIds = new Set();
  for (const system of snapshot.systems) {
    assertFiniteOrNull(system.distancePc, `${system.hostname}.distancePc`);
    for (const planet of system.planets) {
      if (!planet.id || planetIds.has(planet.id)) throw new Error(`Duplicate or missing planet id: ${planet.id}`);
      planetIds.add(planet.id);
      for (const source of [planet.psDefault, planet.psComposite].filter(Boolean)) {
        for (const [key, measurement] of Object.entries(source.measurements)) {
          assertFiniteOrNull(measurement.value, `${planet.name}.${key}.value`);
          assertFiniteOrNull(measurement.errorPlus, `${planet.name}.${key}.errorPlus`);
          assertFiniteOrNull(measurement.errorMinus, `${planet.name}.${key}.errorMinus`);
        }
      }
      if (planet.spectroscopy.species.status !== 'not-provided-by-nasa-tap-metadata') {
        throw new Error(`${planet.name} has an unsupported atmospheric species status`);
      }
      if (planet.spectroscopy.species.values.length !== 0) {
        throw new Error(`${planet.name} contains inferred atmospheric species`);
      }
    }
  }
  const byName = new Map(planets.map(planet => [planet.name, planet]));
  for (const planetName of REQUIRED_BARNARD_PLANETS) {
    const planet = byName.get(planetName);
    if (!planet) throw new Error(`Required Barnard system planet is missing: ${planetName}`);
    if (planet.psComposite?.measurements?.massEarth?.value === null) {
      throw new Error(`${planetName} is missing its PSCompPars mass or mass*sin(i)`);
    }
  }
  for (const hostname of INCLUDED_HOST_OVERRIDES) {
    if (!snapshot.systems.some(system => system.hostname === hostname)) {
      throw new Error(`Required host override is missing: ${hostname}`);
    }
  }
  if (snapshot.statistics.speciesClaims !== 0) throw new Error('Atmospheric species must not be inferred');
}

const [psRows, psCompRows, allSpectraRows] = await Promise.all([
  queryTap(psQuery),
  queryTap(psCompQuery),
  queryTap(spectraQuery)
]);

if (psRows.length < 350) throw new Error(`NASA PS default query returned only ${psRows.length} rows`);
if (psCompRows.length < 350) throw new Error(`NASA PSCompPars query returned only ${psCompRows.length} rows`);

const psByPlanet = new Map(psRows.map(row => [normaliseIdentity(row.pl_name), row]));
const psCompByPlanet = new Map(psCompRows.map(row => [normaliseIdentity(row.pl_name), row]));
const targetPlanetNames = new Set([...psByPlanet.keys(), ...psCompByPlanet.keys()]);
const selectedSpectraRows = allSpectraRows.filter(row => targetPlanetNames.has(normaliseIdentity(row.pl_name)));
const spectraByPlanet = new Map();
for (const row of selectedSpectraRows) {
  const key = normaliseIdentity(row.pl_name);
  if (!spectraByPlanet.has(key)) spectraByPlanet.set(key, []);
  spectraByPlanet.get(key).push(spectrumFromRow(row));
}

const planetNames = [...targetPlanetNames]
  .map(key => psCompByPlanet.get(key)?.pl_name || psByPlanet.get(key)?.pl_name)
  .filter(Boolean)
  .sort((a, b) => String(a).localeCompare(String(b), 'en', { numeric: true }));

const systemsByHost = new Map();
for (const planetName of planetNames) {
  const identity = normaliseIdentity(planetName);
  const psRow = psByPlanet.get(identity) || null;
  const compositeRow = psCompByPlanet.get(identity) || null;
  const preferredRow = compositeRow || psRow;
  const hostname = normaliseText(preferredRow?.hostname);
  if (!hostname) continue;
  const hostIdentity = normaliseIdentity(hostname);
  if (!systemsByHost.has(hostIdentity)) systemsByHost.set(hostIdentity, []);
  systemsByHost.get(hostIdentity).push({ psRow, compositeRow, preferredRow });
}

const systems = [...systemsByHost.values()].map(entries => {
  const representative = entries.find(entry => entry.compositeRow)?.compositeRow || entries[0].psRow;
  const psRepresentative = entries.find(entry => entry.psRow)?.psRow || null;
  const compositeRepresentative = entries.find(entry => entry.compositeRow)?.compositeRow || null;
  const hostname = normaliseText(representative.hostname);
  const psHostReference = parseReference(psRepresentative?.st_refname);
  const psHostMeasurements = makeMeasurements(psRepresentative, STELLAR_MEASUREMENTS, 'ps', psHostReference);
  const compositeHostMeasurements = makeMeasurements(compositeRepresentative, STELLAR_MEASUREMENTS, 'pscomppars', null);
  const planets = entries.map(({ psRow, compositeRow, preferredRow }) => {
    const name = normaliseText(preferredRow.pl_name);
    const spectra = spectraByPlanet.get(normaliseIdentity(name)) || [];
    const counts = spectroscopyCounts(compositeRow || psRow);
    return {
      id: slug(name),
      name,
      letter: normaliseText(preferredRow.pl_letter),
      discovery: makeDiscovery(compositeRow || psRow),
      psDefault: makePsDefault(psRow),
      psComposite: makePsComposite(compositeRow),
      spectroscopy: {
        counts,
        psDefaultCounts: spectroscopyCounts(psRow),
        spectra,
        metadataOnly: true,
        species: {
          status: 'not-provided-by-nasa-tap-metadata',
          values: []
        }
      }
    };
  }).sort((a, b) => a.name.localeCompare(b.name, 'en', { numeric: true }));
  return {
    id: slug(hostname),
    hostname,
    distancePc: finite(representative.sy_dist, 8),
    coordinates: {
      raDeg: finite(representative.ra, 8),
      decDeg: finite(representative.dec, 8)
    },
    host: {
      spectralType: normaliseText(compositeRepresentative?.st_spectype || psRepresentative?.st_spectype),
      psDefault: {
        spectralType: makeTextDatum(psRepresentative?.st_spectype, 'ps', psRepresentative?.st_refname),
        measurements: psHostMeasurements
      },
      psComposite: {
        spectralType: makeTextDatum(
          compositeRepresentative?.st_spectype,
          'pscomppars',
          compositeRepresentative?.st_spectype_reflink
        ),
        measurements: compositeHostMeasurements,
        calculatedFields: calculatedFields(compositeHostMeasurements)
      }
    },
    planets
  };
}).sort((a, b) => (
  (a.distancePc ?? Number.POSITIVE_INFINITY) - (b.distancePc ?? Number.POSITIVE_INFINITY)
  || a.hostname.localeCompare(b.hostname)
));

const generatedAt = new Date().toISOString();
const allPlanets = systems.flatMap(system => system.planets);
const allCompositeMeasurements = [
  ...systems.flatMap(system => Object.values(system.host.psComposite.measurements)),
  ...allPlanets.flatMap(planet => Object.values(planet.psComposite?.measurements || {}))
];
const snapshot = {
  schemaVersion: 1,
  generatedAt,
  scope: {
    name: 'Confirmed exoplanets in the Solar neighbourhood plus named teaching systems',
    nearbyDistancePc: NEARBY_DISTANCE_PC,
    includedHostOverrides: INCLUDED_HOST_OVERRIDES,
    note: 'The Local Group is a group of galaxies. This snapshot covers nearby Milky Way planetary systems and the explicitly included teaching targets.'
  },
  updatePolicy: {
    method: 'Build-time/server-side NASA Exoplanet Archive TAP snapshot',
    runtimeNetwork: 'Production browsers read only this same-origin JSON file and do not query NASA TAP directly.',
    refreshCommand: 'npm run data:exoplanet-atmospheres',
    fallback: 'A failed, empty, or schema-invalid refresh must not overwrite the checked-in or already-copied snapshot.',
    compositionPolicy: 'The TAP spectra table exposes spectrum metadata, not a vetted species-detection catalogue. No atmospheric species are parsed from notes or inferred.'
  },
  sources: [
    {
      id: 'nasa-exoplanet-archive-ps-default',
      table: 'ps',
      name: 'NASA Exoplanet Archive Planetary Systems default parameter sets',
      url: 'https://exoplanetarchive.ipac.caltech.edu/',
      documentationUrl: 'https://exoplanetarchive.ipac.caltech.edu/docs/API_PS_columns.html',
      doi: '10.26133/NEA12',
      retrievedAt: generatedAt
    },
    {
      id: 'nasa-exoplanet-archive-pscomppars',
      table: 'pscomppars',
      name: 'NASA Exoplanet Archive Planetary Systems Composite Parameters',
      url: 'https://exoplanetarchive.ipac.caltech.edu/',
      documentationUrl: 'https://exoplanetarchive.ipac.caltech.edu/docs/pscp_calc.html',
      note: 'Composite values may combine references or be calculated by the archive; per-measurement provenance is retained.',
      retrievedAt: generatedAt
    },
    {
      id: 'nasa-exoplanet-archive-spectra',
      table: 'spectra',
      name: 'NASA Exoplanet Archive Atmospheric Spectroscopy metadata',
      url: 'https://exoplanetarchive.ipac.caltech.edu/',
      documentationUrl: 'https://exoplanetarchive.ipac.caltech.edu/docs/atmospheres/atmospheres_columns.html',
      note: 'TAP provides panel-one spectrum metadata only; wavelength-dependent data points and species detections are not inferred here.',
      retrievedAt: generatedAt
    }
  ],
  queryProvenance: {
    psDefault: { service: TAP_BASE, adql: psQuery, rowsReceived: psRows.length },
    psComposite: { service: TAP_BASE, adql: psCompQuery, rowsReceived: psCompRows.length },
    spectra: {
      service: TAP_BASE,
      adql: spectraQuery,
      rowsReceived: allSpectraRows.length,
      rowsSelectedForScope: selectedSpectraRows.length
    }
  },
  statistics: {
    systems: systems.length,
    planets: allPlanets.length,
    psDefaultRows: psRows.length,
    psCompositeRows: psCompRows.length,
    planetsWithSpectraMetadata: allPlanets.filter(planet => planet.spectroscopy.spectra.length > 0).length,
    planetsWithArchiveSpectraCounts: allPlanets.filter(planet => Object.values(planet.spectroscopy.counts).some(count => Number(count) > 0)).length,
    spectrumMetadataRecords: selectedSpectraRows.length,
    archiveCalculatedMeasurements: allCompositeMeasurements.filter(measurement => measurement.provenance.kind === 'archive-calculated').length,
    speciesClaims: 0,
    latestPsArchiveUpdate: psRows.map(row => normaliseText(row.rowupdate)).filter(Boolean).sort().at(-1) || null
  },
  systems
};

validateSnapshot(snapshot);
// Keep the checked-in and published snapshot below the mirror's 5 MiB blob
// ceiling. Repeated provenance remains structurally explicit, while compact
// JSON avoids spending several megabytes on indentation alone.
const serialised = `${JSON.stringify(snapshot)}\n`;
if (dryRun) {
  JSON.parse(serialised);
  console.log(
    `Exoplanet atmosphere snapshot valid: ${snapshot.statistics.systems} systems, `
    + `${snapshot.statistics.planets} planets, ${snapshot.statistics.spectrumMetadataRecords} spectra metadata records, `
    + `${snapshot.statistics.speciesClaims} inferred species.`
  );
} else {
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  const temporaryPath = `${outputPath}.${process.pid}.tmp`;
  await fs.writeFile(temporaryPath, serialised, 'utf8');
  await fs.rename(temporaryPath, outputPath);
  console.log(
    `Wrote ${path.relative(repositoryRoot, outputPath)} with ${snapshot.statistics.systems} systems, `
    + `${snapshot.statistics.planets} planets and ${snapshot.statistics.spectrumMetadataRecords} spectra metadata records.`
  );
}
