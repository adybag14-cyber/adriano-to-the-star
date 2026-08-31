import fs from 'node:fs/promises';
import path from 'node:path';
import { FLIGHT_EXEMPT_PAGES, SITE_PAGES, canonicalUrl } from './site-pages.mjs';

const publicRoot = path.resolve(process.argv[2] || 'public');
const failures = [];
const fail = message => failures.push(message);
const count = (text, pattern) => (text.match(pattern) || []).length;

async function listHtmlFiles(directory, prefix = '') {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) files.push(...await listHtmlFiles(path.join(directory, entry.name), relative));
    else if (entry.isFile() && entry.name.toLowerCase().endsWith('.html')) files.push(relative);
  }
  return files;
}

for (const page of SITE_PAGES) {
  const file = path.join(publicRoot, ...page.path.split('/'));
  let html;
  try { html = await fs.readFile(file, 'utf8'); }
  catch { fail(`${page.path}: missing from production artifact`); continue; }
  const prefix = page.path.includes('/') ? '../' : '';
  const assetPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const expectedCanonical = canonicalUrl(page).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const checks = [
    [count(html, /<body\b/gi) === 1, 'must have one body'],
    [count(html, /<meta\b[^>]*name="ita-production-metadata"/gi) === 1, 'must have one production metadata marker'],
    [count(html, /<meta\b[^>]*name="description"/gi) === 1, 'must have one description'],
    [count(html, /<meta\b[^>]*name="robots"/gi) === 1, 'must have one robots directive'],
    [count(html, /<link\b[^>]*rel="canonical"/gi) === 1, 'must have one canonical'],
    [new RegExp(`<link rel="canonical" href="${expectedCanonical}">`, 'i').test(html), 'canonical is incorrect'],
    [count(html, /<meta\b[^>]*name="keywords"/gi) === 0, 'obsolete meta keywords remain'],
    [count(html, /<nav\b[^>]*class="[^"]*\bita-breadcrumb\b[^"]*"/gi) === 1, 'must have one visible breadcrumb'],
    [count(html, /id="ita-breadcrumb-structured-data"/gi) === 1, 'must have one generated BreadcrumbList'],
    [!html.includes('"SearchAction"'), 'retired sitelinks SearchAction structured data remains'],
    [!html.includes('"SpeakableSpecification"'), 'unsupported speakable structured data remains'],
    [!html.includes('/html/head/title'), 'malformed speakable XPath remains crawlable'],
    [html.includes(`href="${prefix}site-experience.css?`), 'shared experience stylesheet is missing or unversioned'],
    [html.includes(`href="${prefix}i18n-styles.css?`), 'i18n stylesheet is missing or unversioned'],
    [count(html, new RegExp(`<link\\b[^>]*(?:href="${assetPrefix}ita-universe-shell\\.css\\?v=[^"]+"[^>]*data-ita-universe-shell|data-ita-universe-shell[^>]*href="${assetPrefix}ita-universe-shell\\.css\\?v=[^"]+")`, 'gi')) === 1, 'must have one versioned shared flight stylesheet'],
    [count(html, new RegExp(`<script\\b[^>]*(?:src="${assetPrefix}ita-universe-shell\\.js\\?v=[^"]+"[^>]*data-ita-universe-shell|data-ita-universe-shell[^>]*src="${assetPrefix}ita-universe-shell\\.js\\?v=[^"]+")`, 'gi')) === 1, 'must have one versioned shared flight runtime'],
    [['exoplanet-pioneer.html', 'starsector.html'].includes(page.path) || /src="(?:\.\.\/)?i18n\.js\?v=/.test(html), 'i18n runtime is missing or unversioned'],
    [!/<script\b[^>]*src="(?!https?:|\/\/|data:)[^"]+\.js/i.test(html) || html.includes('data-cfasync="false"'), 'local scripts are not protected from Rocket Loader reordering']
  ];
  for (const [valid, message] of checks) if (!valid) fail(`${page.path}: ${message}`);
  for (const match of html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)) {
    const text = match[1].replace(/<[^>]+>/g, '');
    if (/[\u2600-\u27BF\u{1F300}-\u{1FAFF}]/u.test(text)) fail(`${page.path}: primary h1 contains a decorative emoji`);
  }
  const robots = html.match(/<meta\b[^>]*name="robots"[^>]*content="([^"]+)"/i)?.[1] || '';
  if (page.indexable && !robots.includes('index,follow')) fail(`${page.path}: indexable page is not index,follow`);
  if (!page.indexable && !robots.includes('noindex,follow')) fail(`${page.path}: utility/redirect page is not noindex,follow`);
  for (const match of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try { JSON.parse(match[1]); } catch (error) { fail(`${page.path}: invalid JSON-LD (${error.message})`); }
  }
}

const governedPages = new Set(SITE_PAGES.map(page => page.path));
const flightExemptions = new Map(FLIGHT_EXEMPT_PAGES.map(page => [page.path, page.reason]));
const allHtmlFiles = await listHtmlFiles(publicRoot);
for (const relativePath of allHtmlFiles) {
  if (governedPages.has(relativePath)) continue;
  const html = await fs.readFile(path.join(publicRoot, ...relativePath.split('/')), 'utf8');
  const reason = flightExemptions.get(relativePath);
  if (!reason) {
    fail(`${relativePath}: HTML document is not classified as a governed public route or an approved rendering exemption`);
    continue;
  }
  const escapedReason = reason.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (count(html, new RegExp(`<meta\\b[^>]*name="ita-flight-exempt"[^>]*content="${escapedReason}"|<meta\\b[^>]*content="${escapedReason}"[^>]*name="ita-flight-exempt"`, 'gi')) !== 1) {
    fail(`${relativePath}: approved flight exemption marker is missing or duplicated`);
  }
  if (count(html, /<script\b[^>]*src="[^"]*ita-universe-shell\.js(?:\?[^"']*)?"/gi) !== 0) {
    fail(`${relativePath}: rendering-exempt document must not load the shared flight runtime`);
  }
  if (count(html, /<link\b[^>]*href="[^"]*ita-universe-shell\.css(?:\?[^"']*)?"/gi) !== 0) {
    fail(`${relativePath}: rendering-exempt document must not load the shared flight stylesheet`);
  }
}
for (const { path: relativePath } of FLIGHT_EXEMPT_PAGES) {
  if (!allHtmlFiles.includes(relativePath)) fail(`${relativePath}: declared flight exemption is missing from the artifact`);
}

const sitemapText = await fs.readFile(path.join(publicRoot, 'sitemap.xml'), 'utf8');
const sitemapUrls = [...sitemapText.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => match[1]);
const expectedUrls = SITE_PAGES.filter(page => page.indexable).map(canonicalUrl);
if (JSON.stringify(sitemapUrls) !== JSON.stringify(expectedUrls)) fail(`sitemap.xml: expected the exact ordered set of ${expectedUrls.length} indexable canonical URLs`);
if (count(sitemapText, /<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/g) !== expectedUrls.length) fail('sitemap.xml: every URL needs a valid release lastmod date');
if (new Set(sitemapUrls).size !== sitemapUrls.length) fail('sitemap.xml: duplicate URLs');

const robots = await fs.readFile(path.join(publicRoot, 'robots.txt'), 'utf8');
if (!/^Sitemap: https:\/\/adrianotothestar\.com\/sitemap\.xml\s*$/mi.test(robots)) fail('robots.txt: canonical Sitemap directive is missing');
const indexNowVerificationName = '70cf5dbdf5fa4e0f9e4f847c624468fe';
try {
  const indexNowVerification = await fs.readFile(path.join(publicRoot, `${indexNowVerificationName}.txt`), 'utf8');
  if (indexNowVerification !== indexNowVerificationName) fail('IndexNow verification: public filename and value do not match exactly');
} catch {
  fail('IndexNow verification: public root verification file is missing');
}

const projects = await fs.readFile(path.join(publicRoot, 'projects.html'), 'utf8');
if (count(projects, /<article\b[^>]*class="project-card/g) !== 11) fail('projects.html: expected 11 published project cards');
for (const match of projects.matchAll(/href="(experimental\/[^"]+\.html)"/g)) {
  try {
    const target = await fs.readFile(path.join(publicRoot, ...match[1].split('/')), 'utf8');
    if (!target.includes('ita-lab-disclosure')) fail(`projects.html: ${match[1]} lacks a runtime-boundary disclosure`);
    if (!target.includes('experimental-lab.css?v=')) fail(`projects.html: ${match[1]} lacks versioned lab UI`);
    if (!/<meta name="robots" content="noindex,follow,max-image-preview:large">/i.test(target)) fail(`projects.html: ${match[1]} is not noindex,follow`);
    if (!target.includes(`<link rel="canonical" href="https://adrianotothestar.com/${match[1]}">`)) fail(`projects.html: ${match[1]} lacks its canonical URL`);
    if (/src=["']\/(?:universal-simulation-hub|void-warfare-engine|planetary-environment-engine|galactic-governance-engine|mining-resource-engine|xeno-intelligence-engine|quantum-propulsion-engine|intelligence-shadow-engine|fleet-command-mega-engine|deep-space-industry-engine|procedural-content-engine|galactic-commerce-engine|metaphysics-apotheosis-engine)\.js/i.test(target)) fail(`projects.html: ${match[1]} still loads unrelated mega-engine code`);
  } catch { fail(`projects.html: missing launch target ${match[1]}`); }
}

for (const [legacy, target] of [
  ['offline.html', '../offline.html'],
  ['gta-6-videos.html', '../gta-6-videos.html'],
  ['events.html', '../events.html'],
  ['projects.html', '../projects.html'],
  ['database.html', '../database.html']
]) {
  try {
    const redirect = await fs.readFile(path.join(publicRoot, 'service-page', legacy), 'utf8');
    if (!redirect.includes(`content="0;url=${target}"`)) fail(`service-page/${legacy}: legacy redirect is missing or targets the wrong page`);
    if (!/<meta name="robots" content="noindex,follow">/i.test(redirect)) fail(`service-page/${legacy}: legacy redirect must be noindex,follow`);
  } catch {
    fail(`service-page/${legacy}: Search Console legacy redirect is missing`);
  }
}

const i18n = await fs.readFile(path.join(publicRoot, 'i18n.js'), 'utf8');
if (!i18n.includes("sourceUrl?.searchParams.get('v')")) fail('i18n.js: translation requests do not inherit the release version');
const english = JSON.parse(await fs.readFile(path.join(publicRoot, 'translations', 'en.json'), 'utf8'));
if (!english.hero?.line1 || !english.hero?.line2 || !english.nav?.projects) fail('translations/en.json: current landing translation keys are missing');
const spanish = JSON.parse(await fs.readFile(path.join(publicRoot, 'translations', 'es.json'), 'utf8'));
const aboutTranslationKeys = ['kicker', 'title', 'subtitle', 'heading', 'body1', 'body2', 'databaseCta', 'trackerCta', 'privacyCta', 'privacyLabel'];
if (english.common?.home !== 'Home') fail('translations/en.json: common.home must restore the English breadcrumb label');
for (const key of aboutTranslationKeys) {
  if (!english.pages?.aboutExperience?.[key]) fail(`translations/en.json: pages.aboutExperience.${key} is missing`);
  if (!spanish.pages?.aboutExperience?.[key]) fail(`translations/es.json: pages.aboutExperience.${key} is missing`);
}
const aboutPage = await fs.readFile(path.join(publicRoot, 'about.html'), 'utf8');
if (!aboutPage.includes('data-i18n="common.home"')) fail('about.html: generated Home breadcrumb is not explicitly translatable');
for (const key of aboutTranslationKeys) {
  if (!aboutPage.includes(`data-i18n="pages.aboutExperience.${key}"`)) fail(`about.html: pages.aboutExperience.${key} binding is missing`);
}
const landingPage = await fs.readFile(path.join(publicRoot, 'index.html'), 'utf8');
if (/passage-image|images\/image_2\.jpg/i.test(landingPage)) fail('index.html: terrestrial passenger-experience image remains in production markup');
if (!/<div class="passage-cosmos" aria-hidden="true">/i.test(landingPage)) fail('index.html: code-native deep-space passenger scene is missing');

const spaceFeedsText = await fs.readFile(path.join(publicRoot, 'data', 'space-feeds.json'), 'utf8');
try {
  const spaceFeeds = JSON.parse(spaceFeedsText);
  if (!Array.isArray(spaceFeeds.feeds) || !spaceFeeds.feeds.length) fail('data/space-feeds.json: build-cached feed is empty');
  if (/[\u0080-\u009f\ufffd]/u.test(spaceFeedsText)) fail('data/space-feeds.json: contains replacement/control characters associated with mojibake');
} catch (error) {
  fail(`data/space-feeds.json: invalid JSON (${error.message})`);
}
const spaceIntegrations = await fs.readFile(path.join(publicRoot, 'space-api-integrations.js'), 'utf8');
if (!/data\/space-feeds\.json\?v=[A-Za-z0-9._-]+/.test(spaceIntegrations)) {
  fail('space-api-integrations.js: build-cached feed URL is missing its release version');
}

const atmosphereSnapshotPath = path.join(publicRoot, 'data', 'exoplanet-atmospheres.json');
try {
  const atmosphereSnapshotStat = await fs.stat(atmosphereSnapshotPath);
  if (atmosphereSnapshotStat.size >= 5 * 1024 * 1024) {
    fail(`data/exoplanet-atmospheres.json: ${atmosphereSnapshotStat.size} bytes exceeds the mirror's sub-5 MiB artifact ceiling`);
  }
  const atmosphereSnapshot = JSON.parse(await fs.readFile(atmosphereSnapshotPath, 'utf8'));
  const systems = Array.isArray(atmosphereSnapshot.systems) ? atmosphereSnapshot.systems : [];
  const planets = systems.flatMap(system => Array.isArray(system.planets) ? system.planets : []);
  if (atmosphereSnapshot.schemaVersion !== 1) fail('data/exoplanet-atmospheres.json: schemaVersion must be 1');
  if (systems.length < 200) fail('data/exoplanet-atmospheres.json: expected at least 200 scoped systems');
  if (planets.length < 350) fail('data/exoplanet-atmospheres.json: expected at least 350 scoped confirmed planets');
  if (atmosphereSnapshot.statistics?.systems !== systems.length) fail('data/exoplanet-atmospheres.json: system statistics do not match records');
  if (atmosphereSnapshot.statistics?.planets !== planets.length) fail('data/exoplanet-atmospheres.json: planet statistics do not match records');
  if (atmosphereSnapshot.statistics?.speciesClaims !== 0) fail('data/exoplanet-atmospheres.json: atmospheric species were inferred from metadata');
  const sourceTables = new Set((atmosphereSnapshot.sources || []).map(source => source.table));
  for (const table of ['ps', 'pscomppars', 'spectra']) {
    if (!sourceTables.has(table)) fail(`data/exoplanet-atmospheres.json: source provenance is missing ${table}`);
  }
  if (!/default_flag=1/i.test(atmosphereSnapshot.queryProvenance?.psDefault?.adql || '')) {
    fail('data/exoplanet-atmospheres.json: PS provenance does not select the default parameter set');
  }
  if (!/from pscomppars/i.test(atmosphereSnapshot.queryProvenance?.psComposite?.adql || '')) {
    fail('data/exoplanet-atmospheres.json: PSCompPars query provenance is missing');
  }
  if (!/from spectra/i.test(atmosphereSnapshot.queryProvenance?.spectra?.adql || '')) {
    fail('data/exoplanet-atmospheres.json: spectra metadata query provenance is missing');
  }
  if (!/No atmospheric species are parsed|No atmospheric species/i.test(atmosphereSnapshot.updatePolicy?.compositionPolicy || '')) {
    fail('data/exoplanet-atmospheres.json: no-inferred-species policy is missing');
  }

  const planetIds = new Set();
  for (const system of systems) {
    if (!system.id || !system.hostname) fail('data/exoplanet-atmospheres.json: system identity is incomplete');
    for (const planet of system.planets || []) {
      if (!planet.id || planetIds.has(planet.id)) fail(`data/exoplanet-atmospheres.json: duplicate or missing planet id ${planet.id || '(missing)'}`);
      planetIds.add(planet.id);
      if (planet.spectroscopy?.species?.status !== 'not-provided-by-nasa-tap-metadata' || planet.spectroscopy?.species?.values?.length !== 0) {
        fail(`data/exoplanet-atmospheres.json: ${planet.name} violates the no-inferred-species contract`);
      }
      const defaultMeasurements = planet.psDefault?.measurements || {};
      const compositeMeasurements = planet.psComposite?.measurements || {};
      for (const [key, measurement] of Object.entries(defaultMeasurements)) {
        if (measurement.provenance?.table !== 'ps') fail(`data/exoplanet-atmospheres.json: ${planet.name}.${key} lost PS provenance`);
        if (measurement.value !== null && !Number.isFinite(measurement.value)) fail(`data/exoplanet-atmospheres.json: ${planet.name}.${key} is not finite or null`);
      }
      for (const [key, measurement] of Object.entries(compositeMeasurements)) {
        if (measurement.provenance?.table !== 'pscomppars') fail(`data/exoplanet-atmospheres.json: ${planet.name}.${key} lost PSCompPars provenance`);
        if (measurement.value !== null && !Number.isFinite(measurement.value)) fail(`data/exoplanet-atmospheres.json: ${planet.name}.${key} is not finite or null`);
        const listedCalculated = planet.psComposite?.calculatedFields?.includes(key) === true;
        if (listedCalculated !== (measurement.provenance?.kind === 'archive-calculated')) {
          fail(`data/exoplanet-atmospheres.json: ${planet.name}.${key} calculated provenance is inconsistent`);
        }
      }
    }
  }

  const barnard = systems.find(system => system.hostname === "Barnard's star");
  const barnardNames = (barnard?.planets || []).map(planet => planet.name).sort();
  if (JSON.stringify(barnardNames) !== JSON.stringify(['Barnard b', 'Barnard c', 'Barnard d', 'Barnard e'])) {
    fail('data/exoplanet-atmospheres.json: Barnard system must contain exactly b, c, d, and e');
  }
  for (const planet of barnard?.planets || []) {
    const defaultRadius = planet.psDefault?.measurements?.radiusEarth;
    const compositeRadius = planet.psComposite?.measurements?.radiusEarth;
    const compositeMass = planet.psComposite?.measurements?.massEarth;
    if (defaultRadius?.value !== null) fail(`data/exoplanet-atmospheres.json: ${planet.name} PS default missing radius must remain null`);
    if (!(Number(compositeRadius?.value) > 0) || compositeRadius?.provenance?.kind !== 'archive-calculated') {
      fail(`data/exoplanet-atmospheres.json: ${planet.name} must preserve its calculated PSCompPars radius provenance`);
    }
    if (!(Number(compositeMass?.value) > 0) || compositeMass?.provenance?.kind !== 'literature') {
      fail(`data/exoplanet-atmospheres.json: ${planet.name} must preserve its literature mass or mass*sin(i)`);
    }
    if (planet.psComposite?.massProvenance !== 'Msini') {
      fail(`data/exoplanet-atmospheres.json: ${planet.name} must retain its PSCompPars Msini provenance`);
    }
  }
  const trappist1e = planets.find(planet => planet.name === 'TRAPPIST-1 e');
  if (!trappist1e || !(trappist1e.spectroscopy?.counts?.transmission > 0) || !(trappist1e.spectroscopy?.spectra?.length > 0)) {
    fail('data/exoplanet-atmospheres.json: TRAPPIST-1 e spectroscopy counts and metadata are missing');
  }
} catch (error) {
  fail(`data/exoplanet-atmospheres.json: missing or invalid snapshot (${error.message})`);
}

try {
  const appearanceIndexPath = path.join(publicRoot, 'data', 'exoplanet-appearance-index.json');
  const appearanceIndexStat = await fs.stat(appearanceIndexPath);
  if (appearanceIndexStat.size >= 1024 * 1024) {
    fail(`data/exoplanet-appearance-index.json: ${appearanceIndexStat.size} bytes exceeds the 1 MiB browser budget`);
  }
  const appearanceIndex = JSON.parse(await fs.readFile(appearanceIndexPath, 'utf8'));
  const systems = Array.isArray(appearanceIndex.systems) ? appearanceIndex.systems : [];
  const planets = systems.flatMap(system => system.planets || []);
  if (appearanceIndex.sourceArtifact !== 'data/exoplanet-atmospheres.json') {
    fail('data/exoplanet-appearance-index.json: full-snapshot authority link is missing');
  }
  if (systems.length !== appearanceIndex.statistics?.systems || planets.length !== appearanceIndex.statistics?.planets) {
    fail('data/exoplanet-appearance-index.json: runtime records do not match full-snapshot statistics');
  }
  if (planets.some(planet => planet.spectroscopy?.species?.values?.length)) {
    fail('data/exoplanet-appearance-index.json: compact runtime introduced atmospheric species claims');
  }
  if (planets.some(planet => Array.isArray(planet.spectroscopy?.spectra))) {
    fail('data/exoplanet-appearance-index.json: compact runtime unexpectedly embeds full spectrum metadata arrays');
  }
  const barnard = systems.find(system => system.hostname === "Barnard's star");
  if (JSON.stringify((barnard?.planets || []).map(planet => planet.name).sort()) !== JSON.stringify(['Barnard b', 'Barnard c', 'Barnard d', 'Barnard e'])) {
    fail('data/exoplanet-appearance-index.json: Barnard runtime records are incomplete');
  }
} catch (error) {
  fail(`data/exoplanet-appearance-index.json: missing or invalid compact runtime (${error.message})`);
}

try {
  const corePath = path.join(publicRoot, 'data', 'exoplanet-appearance-core.json');
  const coreStat = await fs.stat(corePath);
  if (coreStat.size >= 128 * 1024) fail(`data/exoplanet-appearance-core.json: ${coreStat.size} bytes exceeds the 128 KiB startup budget`);
  const core = JSON.parse(await fs.readFile(corePath, 'utf8'));
  const corePlanets = (core.systems || []).flatMap(system => system.planets || []);
  if (core.systems?.length !== 8 || corePlanets.length < 20) fail('data/exoplanet-appearance-core.json: teaching-system projection is incomplete');
  if (core.statistics?.fullCatalogSystems < 200 || core.statistics?.fullCatalogPlanets < 350) {
    fail('data/exoplanet-appearance-core.json: full-catalog relationship is missing');
  }
  if (!(core.systems || []).some(system => system.hostname === "Barnard's star" && system.planets?.length === 4)) {
    fail('data/exoplanet-appearance-core.json: Barnard four-world startup record is missing');
  }
} catch (error) {
  fail(`data/exoplanet-appearance-core.json: missing or invalid startup runtime (${error.message})`);
}

try {
  const [educationPage, educationBootstrap, educationViewer, starMaps, databasePage] = await Promise.all([
    fs.readFile(path.join(publicRoot, 'education.html'), 'utf8'),
    fs.readFile(path.join(publicRoot, 'education-bootstrap.js'), 'utf8'),
    fs.readFile(path.join(publicRoot, 'education-viewer.js'), 'utf8'),
    fs.readFile(path.join(publicRoot, 'interactive-star-maps.js'), 'utf8'),
    fs.readFile(path.join(publicRoot, 'database.html'), 'utf8')
  ]);
  for (const marker of ['education-world-select', 'planet-evidence-tier', 'planet-spectrum-status', 'planet-model-disclosure']) {
    if (!educationPage.includes(`id="${marker}"`)) fail(`education.html: ${marker} evidence control is missing`);
  }
  if (!/data\/exoplanet-appearance-core\.json\?v=[A-Za-z0-9._-]+/.test(educationBootstrap)
      || !/data\/exoplanet-appearance-index\.json\?v=[A-Za-z0-9._-]+/.test(educationBootstrap)) {
    fail('education-bootstrap.js: core/fallback appearance snapshots are missing release versions');
  }
  for (const asset of ['planetary-appearance-model.js', 'atmosphere-catalog.js']) {
    if (!new RegExp(`${asset.replace('.', '\\.')}\\?v=[A-Za-z0-9._-]+`).test(educationBootstrap)) {
      fail(`education-bootstrap.js: ${asset} is missing its release version`);
    }
  }
  if (/Catalog estimate|Kepler catalogue|hsl\(\$\{hue\}/i.test(educationViewer)) {
    fail('education-viewer.js: retired name-hashed flat exoplanet fallback remains');
  }
  if (!educationViewer.includes('proceduralTexture: true') || !educationViewer.includes('spatialConstraint')) {
    fail('education-viewer.js: procedural surface provenance metadata is missing');
  }
  if (!starMaps.includes("educationTarget: 'Barnard b'") || !starMaps.includes("planets: 4, educationTarget: 'Barnard b'")) {
    fail('interactive-star-maps.js: Barnard system does not route its four planets through Barnard b');
  }
  if (!databasePage.includes('id="atmosphere-catalog-panel"')) fail('database.html: nearby atmosphere registry is missing');
  if (!/src="planetary-appearance-model\.js\?v=[A-Za-z0-9._-]+"/.test(databasePage)
      || !/src="atmosphere-catalog\.js\?v=[A-Za-z0-9._-]+"/.test(databasePage)) {
    fail('database.html: atmosphere model assets are missing or unversioned');
  }
} catch (error) {
  fail(`Planetary OS integration audit failed (${error.message})`);
}

if (failures.length) {
  console.error(`Production page audit failed with ${failures.length} issue(s):`);
  failures.forEach(message => console.error(` - ${message}`));
  process.exit(1);
}
console.log(`Production page audit passed: ${SITE_PAGES.length} shared-flight pages, ${FLIGHT_EXEMPT_PAGES.length} classified renderer/redirect exemptions, ${expectedUrls.length} sitemap URLs, visible breadcrumbs, metadata, versioned i18n, and project targets.`);
