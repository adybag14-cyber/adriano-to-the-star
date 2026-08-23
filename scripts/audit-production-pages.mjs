import fs from 'node:fs/promises';
import path from 'node:path';
import { SITE_PAGES, canonicalUrl } from './site-pages.mjs';

const publicRoot = path.resolve(process.argv[2] || 'public');
const failures = [];
const fail = message => failures.push(message);
const count = (text, pattern) => (text.match(pattern) || []).length;

for (const page of SITE_PAGES) {
  const file = path.join(publicRoot, ...page.path.split('/'));
  let html;
  try { html = await fs.readFile(file, 'utf8'); }
  catch { fail(`${page.path}: missing from production artifact`); continue; }
  const prefix = page.path.includes('/') ? '../' : '';
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
    [html.includes(`href="${prefix}site-experience.css?`), 'shared experience stylesheet is missing or unversioned'],
    [html.includes(`href="${prefix}i18n-styles.css?`), 'i18n stylesheet is missing or unversioned'],
    [['exoplanet-pioneer.html', 'starsector.html'].includes(page.path) || /src="(?:\.\.\/)?i18n\.js\?v=/.test(html), 'i18n runtime is missing or unversioned'],
    [!/<script\b[^>]*src="(?!https?:|\/\/|data:)[^"]+\.js/i.test(html) || html.includes('data-cfasync="false"'), 'local scripts are not protected from Rocket Loader reordering']
  ];
  for (const [valid, message] of checks) if (!valid) fail(`${page.path}: ${message}`);
  const robots = html.match(/<meta\b[^>]*name="robots"[^>]*content="([^"]+)"/i)?.[1] || '';
  if (page.indexable && !robots.includes('index,follow')) fail(`${page.path}: indexable page is not index,follow`);
  if (!page.indexable && !robots.includes('noindex,follow')) fail(`${page.path}: utility/redirect page is not noindex,follow`);
  for (const match of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try { JSON.parse(match[1]); } catch (error) { fail(`${page.path}: invalid JSON-LD (${error.message})`); }
  }
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
if (count(projects, /<article\b[^>]*class="project-card/g) !== 10) fail('projects.html: expected 10 published project cards');
for (const match of projects.matchAll(/href="(experimental\/[^"]+\.html)"/g)) {
  try {
    const target = await fs.readFile(path.join(publicRoot, ...match[1].split('/')), 'utf8');
    if (!target.includes('ita-lab-disclosure')) fail(`projects.html: ${match[1]} lacks a runtime-boundary disclosure`);
    if (!target.includes('experimental-lab.css?v=')) fail(`projects.html: ${match[1]} lacks versioned lab UI`);
    if (/src=["']\/(?:universal-simulation-hub|void-warfare-engine|planetary-environment-engine|galactic-governance-engine|mining-resource-engine|xeno-intelligence-engine|quantum-propulsion-engine|intelligence-shadow-engine|fleet-command-mega-engine|deep-space-industry-engine|procedural-content-engine|galactic-commerce-engine|metaphysics-apotheosis-engine)\.js/i.test(target)) fail(`projects.html: ${match[1]} still loads unrelated mega-engine code`);
  } catch { fail(`projects.html: missing launch target ${match[1]}`); }
}

const i18n = await fs.readFile(path.join(publicRoot, 'i18n.js'), 'utf8');
if (!i18n.includes("sourceUrl?.searchParams.get('v')")) fail('i18n.js: translation requests do not inherit the release version');
const english = JSON.parse(await fs.readFile(path.join(publicRoot, 'translations', 'en.json'), 'utf8'));
if (!english.hero?.line1 || !english.hero?.line2 || !english.nav?.projects) fail('translations/en.json: current landing translation keys are missing');

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

if (failures.length) {
  console.error(`Production page audit failed with ${failures.length} issue(s):`);
  failures.forEach(message => console.error(` - ${message}`));
  process.exit(1);
}
console.log(`Production page audit passed: ${SITE_PAGES.length} pages, ${expectedUrls.length} sitemap URLs, visible breadcrumbs, metadata, versioned i18n, and project targets.`);
