#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, '..');
const outputArgument = process.argv.find(argument => argument.startsWith('--output='));
const outputPath = path.resolve(repositoryRoot, outputArgument?.slice('--output='.length) || 'data/tracker/stellar-neighborhood.json');
const dryRun = process.argv.includes('--check');
const TAP_BASE = 'https://exoplanetarchive.ipac.caltech.edu/TAP/sync';
const COLUMNS = 'pl_name,hostname,ra,dec,sy_dist,st_spectype,st_teff,pl_rade,pl_masse,pl_orbper,discoverymethod,disc_year,disc_facility,disc_telescope,rowupdate';
const nearbyQuery = `select ${COLUMNS} from ps where default_flag=1 and sy_dist<25 order by sy_dist asc`;
const missionQuery = `select top 120 ${COLUMNS} from ps where default_flag=1 and (disc_facility like '%Transiting Exoplanet Survey Satellite%' or disc_facility like '%Kepler%' or disc_facility like '%K2%') order by disc_year desc,rowupdate desc`;

const sources = [
  {
    id: 'nasa-exoplanet-archive-ps',
    name: 'NASA Exoplanet Archive — Planetary Systems table',
    organisation: 'NASA Exoplanet Science Institute / IPAC, Caltech',
    url: 'https://exoplanetarchive.ipac.caltech.edu/',
    documentationUrl: 'https://exoplanetarchive.ipac.caltech.edu/docs/TAP/usingTAP.html',
    doi: '10.26133/NEA12',
    licenceNote: 'Public scientific archive. Consult the archive acknowledgement and citation guidance before scholarly reuse.'
  },
  {
    id: 'esa-gaia-gcns',
    name: 'Gaia EDR3 Catalogue of Nearby Stars (GCNS)',
    organisation: 'European Space Agency / Gaia DPAC',
    url: 'https://www.cosmos.esa.int/web/gaia/edr3-gcns',
    documentationUrl: 'https://gea.esac.esa.int/archive/documentation/GEDR3/index.html',
    doi: '10.1051/0004-6361/202039498',
    licenceNote: 'Catalogue and documentation attribution follows ESA/Gaia/DPAC guidance.'
  },
  {
    id: 'cns5',
    name: 'The Fifth Catalogue of Nearby Stars (CNS5)',
    organisation: 'Leibniz Institute for Astrophysics Potsdam and collaborators',
    url: 'https://www.aanda.org/articles/aa/full_html/2023/02/aa44250-22/aa44250-22.html',
    documentationUrl: 'https://doi.org/10.1051/0004-6361/202244250',
    doi: '10.1051/0004-6361/202244250',
    licenceNote: 'Use the paper and its catalogue for research-grade analysis; the tracker includes only a compact teaching subset.'
  },
  {
    id: 'nasa-science-catalog',
    name: 'NASA Science Exoplanet Catalog',
    organisation: 'National Aeronautics and Space Administration',
    url: 'https://science.nasa.gov/exoplanets/exoplanet-catalog/',
    documentationUrl: 'https://science.nasa.gov/exoplanets/',
    licenceNote: 'Authoritative public context and discovery catalogue; numerical rows in this snapshot come from the NASA Exoplanet Archive.'
  }
];

// This small teaching subset fills prominent nearby systems that do not appear in the
// exoplanet-host query. Coordinates are ICRS/J2000-style display values rounded for
// visualisation; GCNS/CNS5 remain the authorities for precision science.
const landmarkStars = [
  { id: 'sol', name: 'Sun', aliases: ['Sol'], raDeg: 0, decDeg: 0, distancePc: 0, spectralType: 'G2 V', temperatureK: 5772, sourceIds: ['cns5'], note: 'Origin of the heliocentric teaching frame.' },
  { id: 'alpha-centauri-a', name: 'Alpha Centauri A', aliases: ['Rigil Kentaurus A'], raDeg: 219.9021, decDeg: -60.8339, distancePc: 1.347, spectralType: 'G2 V', temperatureK: 5790, sourceIds: ['esa-gaia-gcns', 'cns5'], note: 'Nearest Sun-like stellar component; part of the Alpha Centauri triple system.' },
  { id: 'alpha-centauri-b', name: 'Alpha Centauri B', aliases: ['Rigil Kentaurus B'], raDeg: 219.8961, decDeg: -60.8375, distancePc: 1.347, spectralType: 'K1 V', temperatureK: 5260, sourceIds: ['esa-gaia-gcns', 'cns5'], note: 'K-dwarf companion to Alpha Centauri A.' },
  { id: 'wolf-359', name: 'Wolf 359', aliases: ['CN Leonis'], raDeg: 164.1204, decDeg: 7.0147, distancePc: 2.409, spectralType: 'M6 V', temperatureK: 2800, sourceIds: ['esa-gaia-gcns', 'cns5'], note: 'A nearby flare star and very low-mass red dwarf.' },
  { id: 'lalande-21185', name: 'Lalande 21185', aliases: ['Gliese 411'], raDeg: 165.8342, decDeg: 35.9700, distancePc: 2.547, spectralType: 'M2 V', temperatureK: 3600, sourceIds: ['esa-gaia-gcns', 'cns5'], note: 'A high-proper-motion red dwarf in Ursa Major.' },
  { id: 'sirius-a', name: 'Sirius A', aliases: ['Alpha Canis Majoris A'], raDeg: 101.2872, decDeg: -16.7161, distancePc: 2.637, spectralType: 'A1 V', temperatureK: 9940, sourceIds: ['esa-gaia-gcns', 'cns5'], note: 'Brightest star in Earth’s night sky; paired with a white dwarf.' },
  { id: 'sirius-b', name: 'Sirius B', aliases: ['Alpha Canis Majoris B'], raDeg: 101.2872, decDeg: -16.7161, distancePc: 2.637, spectralType: 'DA2', temperatureK: 25200, sourceIds: ['cns5'], note: 'White-dwarf companion to Sirius A; offset slightly in the scene for visibility.' },
  { id: 'luyten-726-8-a', name: 'Luyten 726-8 A', aliases: ['BL Ceti'], raDeg: 24.7550, decDeg: -17.9500, distancePc: 2.675, spectralType: 'M5.5 V', temperatureK: 2670, sourceIds: ['esa-gaia-gcns', 'cns5'], note: 'Nearby red-dwarf binary component.' },
  { id: 'luyten-726-8-b', name: 'Luyten 726-8 B', aliases: ['UV Ceti'], raDeg: 24.7552, decDeg: -17.9497, distancePc: 2.675, spectralType: 'M6 V', temperatureK: 2670, sourceIds: ['esa-gaia-gcns', 'cns5'], note: 'Prototype UV Ceti flare star.' },
  { id: 'ross-154', name: 'Ross 154', aliases: ['V1216 Sagittarii'], raDeg: 270.1610, decDeg: -23.8370, distancePc: 2.969, spectralType: 'M3.5 V', temperatureK: 3240, sourceIds: ['esa-gaia-gcns', 'cns5'], note: 'Nearby flare star in Sagittarius.' },
  { id: 'ross-248', name: 'Ross 248', aliases: ['HH Andromedae'], raDeg: 355.4790, decDeg: 44.1710, distancePc: 3.160, spectralType: 'M6 V', temperatureK: 2790, sourceIds: ['esa-gaia-gcns', 'cns5'], note: 'High-proper-motion red dwarf moving closer to the Solar System.' },
  { id: 'procyon-a', name: 'Procyon A', aliases: ['Alpha Canis Minoris A'], raDeg: 114.8255, decDeg: 5.2250, distancePc: 3.514, spectralType: 'F5 IV-V', temperatureK: 6530, sourceIds: ['esa-gaia-gcns', 'cns5'], note: 'Nearby evolved F star with a white-dwarf companion.' },
  { id: 'epsilon-indi-a', name: 'Epsilon Indi A', aliases: ['HD 209100'], raDeg: 330.8400, decDeg: -56.7860, distancePc: 3.638, spectralType: 'K5 V', temperatureK: 4630, sourceIds: ['esa-gaia-gcns', 'cns5'], note: 'Nearby K dwarf with a distant brown-dwarf pair.' }
];

function normaliseText(value) {
  if (value == null) return null;
  return String(value)
    .replace(/&plusmn;?/gi, '±')
    .replace(/&amp;/gi, '&')
    .replace(/<[^>]+>/g, '')
    .trim() || null;
}

function finite(value, digits = null) {
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  return digits == null ? number : Number(number.toFixed(digits));
}

function slug(value) {
  return String(value).toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function coordinates(raDeg, decDeg, distancePc) {
  if (!distancePc) return { xPc: 0, yPc: 0, zPc: 0 };
  const ra = raDeg * Math.PI / 180;
  const dec = decDeg * Math.PI / 180;
  return {
    xPc: finite(distancePc * Math.cos(dec) * Math.cos(ra), 5),
    yPc: finite(distancePc * Math.cos(dec) * Math.sin(ra), 5),
    zPc: finite(distancePc * Math.sin(dec), 5)
  };
}

function makeTapUrl(query) {
  const url = new URL(TAP_BASE);
  url.searchParams.set('query', query);
  url.searchParams.set('format', 'json');
  return url;
}

async function queryTap(query) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(new Error('NASA TAP request timed out')), 60_000);
  try {
    const response = await fetch(makeTapUrl(query), {
      headers: { Accept: 'application/json', 'User-Agent': 'adrianotothestar-static-snapshot/1.0 (+https://adrianotothestar.com/tracker.html)' },
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

function planetFromRow(row) {
  return {
    name: normaliseText(row.pl_name),
    discoveryYear: finite(row.disc_year),
    method: normaliseText(row.discoverymethod),
    facility: normaliseText(row.disc_facility),
    telescope: normaliseText(row.disc_telescope),
    radiusEarth: finite(row.pl_rade, 4),
    massEarth: finite(row.pl_masse, 4),
    orbitalPeriodDays: finite(row.pl_orbper, 6),
    archiveUpdated: normaliseText(row.rowupdate)
  };
}

function groupNearbyHosts(rows) {
  const grouped = new Map();
  for (const row of rows) {
    const hostName = normaliseText(row.hostname);
    const distancePc = finite(row.sy_dist, 6);
    const raDeg = finite(row.ra, 7);
    const decDeg = finite(row.dec, 7);
    if (!hostName || distancePc == null || raDeg == null || decDeg == null) continue;
    if (!grouped.has(hostName)) {
      grouped.set(hostName, {
        id: `nea-${slug(hostName)}`,
        name: hostName,
        aliases: [],
        raDeg,
        decDeg,
        distancePc,
        spectralType: normaliseText(row.st_spectype) || 'Unreported',
        temperatureK: finite(row.st_teff),
        sourceIds: ['nasa-exoplanet-archive-ps'],
        note: 'Confirmed exoplanet host in the NASA Exoplanet Archive Planetary Systems table.',
        kind: 'planet-host',
        planets: []
      });
    }
    const planet = planetFromRow(row);
    if (planet.name && !grouped.get(hostName).planets.some(item => item.name === planet.name)) grouped.get(hostName).planets.push(planet);
  }
  return [...grouped.values()]
    .sort((a, b) => a.distancePc - b.distancePc || a.name.localeCompare(b.name));
}

function prepareStar(star, index) {
  const distancePc = finite(star.distancePc, 6) ?? 0;
  const visualOffset = star.id === 'sirius-b' ? 0.045 : star.id === 'luyten-726-8-b' ? 0.035 : star.id === 'alpha-centauri-b' ? 0.04 : 0;
  const base = coordinates(star.raDeg, star.decDeg, distancePc);
  return {
    ...star,
    order: index,
    distancePc,
    distanceLy: finite(distancePc * 3.261563777, 4),
    coordinatesPc: visualOffset ? { ...base, zPc: finite(base.zPc + visualOffset, 5) } : base,
    planetCount: star.planets?.length || 0,
    planets: star.planets || [],
    kind: star.kind || (star.id === 'sol' ? 'origin' : 'landmark')
  };
}

function prepareMissionDiscoveries(rows) {
  const seen = new Set();
  const result = [];
  for (const row of rows) {
    const planetName = normaliseText(row.pl_name);
    if (!planetName || seen.has(planetName)) continue;
    seen.add(planetName);
    result.push({
      id: `mission-${slug(planetName)}`,
      planetName,
      hostName: normaliseText(row.hostname),
      raDeg: finite(row.ra, 7),
      decDeg: finite(row.dec, 7),
      distancePc: finite(row.sy_dist, 5),
      distanceLy: finite(Number(row.sy_dist) * 3.261563777, 2),
      spectralType: normaliseText(row.st_spectype) || 'Unreported',
      temperatureK: finite(row.st_teff),
      ...planetFromRow(row),
      sourceIds: ['nasa-exoplanet-archive-ps', 'nasa-science-catalog']
    });
    if (result.length >= 30) break;
  }
  return result;
}

const [nearbyRows, missionRows] = await Promise.all([queryTap(nearbyQuery), queryTap(missionQuery)]);
if (nearbyRows.length < 100) throw new Error(`Refusing to replace snapshot: only ${nearbyRows.length} nearby planet rows returned`);
if (missionRows.length < 20) throw new Error(`Refusing to replace snapshot: only ${missionRows.length} NASA-mission rows returned`);

const nearbyHosts = groupNearbyHosts(nearbyRows);
const stars = [...landmarkStars, ...nearbyHosts]
  .filter((star, index, all) => all.findIndex(candidate => candidate.id === star.id) === index)
  .map(prepareStar)
  .sort((a, b) => a.distancePc - b.distancePc || a.name.localeCompare(b.name));
const nasaDiscoveries = prepareMissionDiscoveries(missionRows);
const generatedAt = new Date().toISOString();
const snapshot = {
  schemaVersion: 1,
  generatedAt,
  coordinateFrame: {
    name: 'Heliocentric equatorial teaching frame',
    epoch: 'ICRS/J2000-style display coordinates',
    units: 'parsec',
    axes: { x: 'RA 0°, Dec 0°', y: 'RA 90°, Dec 0°', z: 'north celestial pole' },
    warning: 'Scene coordinates are for education and relative orientation, not spacecraft navigation. Binary components may be visually separated beyond their true plotted separation.'
  },
  updatePolicy: {
    method: 'Build-time/server-side snapshot',
    runtimeNetwork: 'The production browser fetches only this same-origin JSON file. It does not query NASA or ESA directly.',
    refreshCommand: 'node scripts/update-tracker-data.mjs',
    validation: 'A failed, empty, or unexpectedly small upstream response does not overwrite the checked-in snapshot.'
  },
  statistics: {
    sceneStars: stars.length,
    planetHosts: stars.filter(star => star.kind === 'planet-host').length,
    scenePlanets: stars.reduce((total, star) => total + star.planetCount, 0),
    nasaMissionDiscoveries: nasaDiscoveries.length,
    maximumSceneDistancePc: Math.max(...stars.map(star => star.distancePc)),
    latestArchiveUpdate: [...stars.flatMap(star => star.planets), ...nasaDiscoveries].map(item => item.archiveUpdated).filter(Boolean).sort().at(-1) || null
  },
  sources: sources.map(source => ({ ...source, retrievedAt: source.id === 'nasa-exoplanet-archive-ps' ? generatedAt : null })),
  queryProvenance: {
    nearbyHosts: { service: TAP_BASE, adql: nearbyQuery, rowsReceived: nearbyRows.length, selection: 'All distinct confirmed-planet host systems within 25 pc returned by the validated default-solution query.' },
    nasaMissionDiscoveries: { service: TAP_BASE, adql: missionQuery, rowsReceived: missionRows.length, selection: 'Latest 30 distinct default-solution planets whose discovery facility is TESS, Kepler, or K2.' }
  },
  stars,
  nasaDiscoveries,
  teachingNotes: [
    { title: 'Local Group vs. local neighbourhood', text: 'The Local Group is the galaxy group containing the Milky Way, Andromeda, Triangulum, and many dwarf galaxies. Individual nearby stars shown here belong to the Solar neighbourhood inside the Milky Way.' },
    { title: 'Parallax and distance', text: 'At small angles, distance in parsecs is approximately the reciprocal of annual parallax in arcseconds. Catalogue inference becomes more nuanced when uncertainties and selection functions matter.' },
    { title: 'Selection effects', text: 'A map of confirmed planet hosts is not a representative sample of all stars. Survey footprints, cadence, stellar brightness, activity, orbital inclination, and instrument sensitivity strongly shape the detected population.' },
    { title: 'Discovery attribution', text: 'NASA maintains the archive, but individual discoveries can involve NASA missions, international observatories, and independent research teams. The facility field is preserved rather than replacing it with a blanket attribution.' }
  ]
};

const serialised = `${JSON.stringify(snapshot, null, 2)}\n`;
if (dryRun) {
  JSON.parse(serialised);
  console.log(`Tracker snapshot valid: ${stars.length} stars, ${snapshot.statistics.scenePlanets} confirmed planets, ${nasaDiscoveries.length} mission discoveries.`);
} else {
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  const temporaryPath = `${outputPath}.${process.pid}.tmp`;
  await fs.writeFile(temporaryPath, serialised, 'utf8');
  await fs.rename(temporaryPath, outputPath);
  console.log(`Wrote ${path.relative(repositoryRoot, outputPath)} with ${stars.length} scene stars and ${nasaDiscoveries.length} NASA-mission discoveries.`);
}
