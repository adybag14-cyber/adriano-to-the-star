import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { FLIGHT_EXEMPT_PAGES, SITE_ORIGIN, SITE_PAGES, canonicalUrl } from './site-pages.mjs';

const publicRoot = path.resolve(process.argv[2] || 'public');
const legacyMegaEnginePattern = /\s*(?:<!--\s*MASTER MEGA-ENGINE ARCHITECTURE\s*-->)?\s*<script\b[^>]*src=["']\/?(?:universal-simulation-hub|void-warfare-engine|planetary-environment-engine|galactic-governance-engine|mining-resource-engine|xeno-intelligence-engine|quantum-propulsion-engine|intelligence-shadow-engine|fleet-command-mega-engine|deep-space-industry-engine|procedural-content-engine|galactic-commerce-engine|metaphysics-apotheosis-engine)\.js(?:\?[^"']*)?["'][^>]*><\/script>/gi;
const retiredSupabaseScriptPattern = /\s*<script\b[^>]*src=["'][^"']*(?:@supabase\/supabase-js|supabase-config\.js|auth-supabase\.js|supabase-integration\.js)[^"']*["'][^>]*><\/script>/gi;
const googleFontPattern = /\s*<(?:link|style)\b[^>]*(?:fonts\.googleapis\.com|fonts\.gstatic\.com)[^>]*>(?:<\/style>)?/gi;
const escapeHtml = value => String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const escapeJsonForHtml = value => JSON.stringify(value, null, 2).replaceAll('<', '\\u003c');

function releaseDate() {
  const candidates = [process.env.SITE_RELEASE_DATE, process.env.CI_COMMIT_TIMESTAMP];
  try {
    candidates.push(execFileSync('git', ['show', '-s', '--format=%cI', 'HEAD'], { encoding: 'utf8' }).trim());
  } catch {}
  for (const candidate of candidates) {
    if (!candidate) continue;
    const parsed = new Date(candidate);
    if (!Number.isNaN(parsed.valueOf())) return parsed.toISOString().slice(0, 10);
  }
  throw new Error('Unable to determine an accurate release date for the sitemap.');
}

function removeUnsupportedStructuredData(value) {
  if (Array.isArray(value)) return value.map(removeUnsupportedStructuredData).filter(item => item !== null);
  if (!value || typeof value !== 'object') return value;
  const types = Array.isArray(value['@type']) ? value['@type'] : [value['@type']];
  if (types.includes('BreadcrumbList') || types.includes('SearchAction') || types.includes('SpeakableSpecification')) return null;
  const result = {};
  for (const [key, child] of Object.entries(value)) {
    const cleaned = removeUnsupportedStructuredData(child);
    if (cleaned !== null && (!Array.isArray(cleaned) || cleaned.length)) result[key] = cleaned;
  }
  return result;
}

function normalizeStructuredData(html) {
  return html.replace(/<script\b([^>]*type=["']application\/ld\+json["'][^>]*)>([\s\S]*?)<\/script>/gi, (full, attributes, source) => {
    try {
      const cleaned = removeUnsupportedStructuredData(JSON.parse(source));
      if (cleaned === null || (Array.isArray(cleaned) && !cleaned.length)) return '';
      return `<script${attributes}>\n${escapeJsonForHtml(cleaned)}\n</script>`;
    } catch {
      return full;
    }
  });
}

function replaceTitle(html, title) {
  const tag = `<title>${escapeHtml(title)}</title>`;
  return /<title>[\s\S]*?<\/title>/i.test(html) ? html.replace(/<title>[\s\S]*?<\/title>/i, tag) : html.replace(/<head\b[^>]*>/i, match => `${match}\n${tag}`);
}

function removeHeadTag(html, pattern) {
  return html.replace(pattern, '');
}

function headMetadata(page) {
  const url = canonicalUrl(page);
  const prefix = page.path.includes('/') ? '../' : '';
  const robots = page.indexable ? 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1' : 'noindex,follow';
  const metadata = [
    '<meta name="ita-production-metadata" content="2026-08-30">',
    `<meta name="description" content="${escapeHtml(page.description)}">`,
    `<meta name="robots" content="${robots}">`,
    '<meta name="googlebot" content="max-image-preview:large,max-snippet:-1,max-video-preview:-1">',
    '<meta name="theme-color" content="#050814">',
    '<meta name="color-scheme" content="dark">',
    `<link rel="canonical" href="${url}">`,
    `<meta property="og:title" content="${escapeHtml(page.title)}">`,
    `<meta property="og:description" content="${escapeHtml(page.description)}">`,
    `<meta property="og:url" content="${url}">`,
    '<meta property="og:type" content="website">',
    '<meta property="og:site_name" content="Adriano To The Star">',
    `<meta property="og:image" content="${SITE_ORIGIN}/images/bg-large.jpg">`,
    '<meta property="og:image:width" content="1905">',
    '<meta property="og:image:height" content="646">',
    '<meta property="og:image:alt" content="Adriano To The Star deep-space research interface">',
    '<meta name="twitter:card" content="summary_large_image">',
    `<meta name="twitter:title" content="${escapeHtml(page.title)}">`,
    `<meta name="twitter:description" content="${escapeHtml(page.description)}">`,
    `<meta name="twitter:image" content="${SITE_ORIGIN}/images/bg-large.jpg">`,
    '<meta name="twitter:image:alt" content="Adriano To The Star deep-space research interface">',
    `<link rel="stylesheet" href="${prefix}site-experience.css">`,
    `<link rel="stylesheet" href="${prefix}i18n-styles.css">`,
    `<link rel="stylesheet" href="${prefix}ita-music-player.css">`,
    `<link rel="stylesheet" href="${prefix}ita-universe-shell.css" data-ita-universe-shell>`
  ];
  // Pioneer consolidates its own ordered startup graph. Keep the shared visual
  // shell independent and load it after that graph instead of bundling it into
  // the simulation's systems payload.
  if (page.path !== 'exoplanet-pioneer.html') {
    metadata.push(`<script src="${prefix}ita-universe-shell.js" defer data-ita-universe-shell></script>`);
  }
  return metadata.join('\n    ');
}

function breadcrumbFor(page, floating = false) {
  const depth = page.path.split('/').length - 1;
  const homeHref = depth ? '../' : '/';
  const crumbs = [{ name: 'Home', href: homeHref, url: `${SITE_ORIGIN}/`, i18n: 'common.home' }];
  if (page.parent) crumbs.push({ name: page.parent[0], href: depth ? `../${page.parent[1]}` : page.parent[1], url: `${SITE_ORIGIN}/${page.parent[1]}` });
  crumbs.push({ name: page.title.split('|')[0].trim(), href: null, url: canonicalUrl(page), i18n: page.breadcrumbI18n });
  const visible = crumbs.map((crumb, index) => {
    const i18n = crumb.i18n ? ` data-i18n="${escapeHtml(crumb.i18n)}"` : '';
    const content = crumb.href ? `<a href="${crumb.href}"${i18n}>${escapeHtml(crumb.name)}</a>` : `<span aria-current="page"${i18n}>${escapeHtml(crumb.name)}</span>`;
    return `<li>${content}${index < crumbs.length - 1 ? '<span aria-hidden="true">/</span>' : ''}</li>`;
  }).join('');
  const structured = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    '@id': `${canonicalUrl(page)}#breadcrumb`,
    itemListElement: crumbs.map((crumb, index) => ({ '@type': 'ListItem', position: index + 1, name: crumb.name, item: crumb.url }))
  };
  return {
    visible: `<nav class="ita-breadcrumb${floating ? ' ita-breadcrumb--floating' : ''}" aria-label="Breadcrumb"><ol>${visible}</ol></nav>`,
    structured: `<script id="ita-breadcrumb-structured-data" type="application/ld+json">\n${escapeJsonForHtml(structured)}\n</script>`
  };
}

function refreshBodyClass(html, page) {
  const immersive = new Set(['index.html', 'database.html', 'education.html', 'exoplanet-pioneer.html', 'mechgen.html', 'projects.html', 'star-maps.html']);
  return html.replace(/<body\b([^>]*)>/i, (full, attributes) => {
    const classMatch = attributes.match(/\bclass\s*=\s*(["'])(.*?)\1/i);
    const additions = ['ita-site-refresh', immersive.has(page.path) ? 'ita-site-immersive' : 'ita-site-standard'];
    if (classMatch) {
      const classes = new Set(`${classMatch[2]} ${additions.join(' ')}`.trim().split(/\s+/));
      return `<body${attributes.replace(classMatch[0], `class="${[...classes].join(' ')}"`)}>`;
    }
    return `<body${attributes} class="${additions.join(' ')}">`;
  });
}

function ensureMainTarget(html) {
  return html.replace(/<main\b([^>]*)>/i, (full, attributes) => {
    let updated = attributes;
    if (!/\bid\s*=/i.test(updated)) updated += ' id="main-content"';
    if (!/\btabindex\s*=/i.test(updated)) updated += ' tabindex="-1"';
    return `<main${updated}>`;
  });
}

function ensurePolicyLink(html, page) {
  const prefix = page.path.includes('/') ? '../' : '';
  if (/href=["'][^"']*privacy\.html(?:[?#][^"']*)?["']/i.test(html)) return html;
  const links = `<nav class="ita-policy-links" aria-label="Site policies"><a href="${prefix}privacy.html">Privacy notice</a></nav>`;
  if (/<footer\b/i.test(html)) return html.replace(/<\/footer>/i, `${links}\n</footer>`);
  return html.replace(/<\/body>/i, `${links}\n</body>`);
}

async function transformPage(page) {
  const file = path.join(publicRoot, ...page.path.split('/'));
  let html = await fs.readFile(file, 'utf8');
  html = html.replace(legacyMegaEnginePattern, '');
  html = html.replace(retiredSupabaseScriptPattern, '');
  html = html.replace(googleFontPattern, '');
  html = normalizeStructuredData(html);
  html = replaceTitle(html, page.title);
  html = removeHeadTag(html, /\s*<meta\b[^>]*name=["']keywords["'][^>]*>/gi);
  html = removeHeadTag(html, /\s*<meta\b[^>]*name=["'](?:description|robots|googlebot)["'][^>]*>/gi);
  html = removeHeadTag(html, /\s*<meta\b[^>]*property=["']og:(?:title|description|url|type|site_name|image)["'][^>]*>/gi);
  html = removeHeadTag(html, /\s*<meta\b[^>]*name=["']twitter:(?:card|title|description|image)["'][^>]*>/gi);
  html = removeHeadTag(html, /\s*<meta\b[^>]*name=["'](?:theme-color|color-scheme)["'][^>]*>/gi);
  html = removeHeadTag(html, /\s*<link\b[^>]*rel=["']canonical["'][^>]*>/gi);
  html = removeHeadTag(html, /\s*<link\b[^>]*href=["'](?:\.\.\/)?(?:site-experience|i18n-styles|ita-music-player|ita-universe-shell)\.css(?:\?[^"']*)?["'][^>]*>/gi);
  html = removeHeadTag(html, /\s*<script\b[^>]*src=["'](?:\.\.\/)?ita-universe-shell\.js(?:\?[^"']*)?["'][^>]*><\/script>/gi);
  html = removeHeadTag(html, /\s*<meta\b[^>]*name=["']ita-production-metadata["'][^>]*>/gi);
  html = html.replace(/<\/head>/i, `    ${headMetadata(page)}\n</head>`);
  html = refreshBodyClass(html, page);
  html = ensureMainTarget(html);
  html = ensurePolicyLink(html, page);
  html = html.replace(/\s*<nav\b[^>]*class=["'][^"']*\bita-breadcrumb\b[^"']*["'][^>]*>[\s\S]*?<\/nav>/gi, '');
  html = html.replace(/\s*<script\b[^>]*id=["']ita-breadcrumb-structured-data["'][^>]*>[\s\S]*?<\/script>/gi, '');
  const hasMain = /<main\b/i.test(html);
  const floatingBreadcrumbPages = new Set(['education.html', 'exoplanet-pioneer.html', 'starsector-login.html']);
  const breadcrumb = breadcrumbFor(page, !hasMain || floatingBreadcrumbPages.has(page.path));
  html = html.replace(/<head\b[^>]*>[\s\S]*?<\/head>/i, head => {
    if (/<script\b/i.test(head)) return head.replace(/<script\b/i, `${breadcrumb.structured}\n<script`);
    return head.replace(/<\/head>/i, `${breadcrumb.structured}\n</head>`);
  });
  const skip = hasMain ? '<a class="ita-skip-link" href="#main-content">Skip to main content</a>\n' : '';
  html = html.replace(/<body\b[^>]*>/i, match => `${match}\n${skip}${breadcrumb.visible}`);
  const selfContainedRuntime = new Set(['exoplanet-pioneer.html', 'starsector.html']);
  if (!selfContainedRuntime.has(page.path) && !/(?:src=["'](?:\.\.\/)?i18n\.js(?:\?|["']))/i.test(html)) {
    const prefix = page.path.includes('/') ? '../' : '';
    html = html.replace(/<\/body>/i, `  <script src="${prefix}i18n.js" defer></script>\n</body>`);
  }
  if (page.path !== 'starsector.html' && !/(?:src=["'](?:\.\.\/)?site-runtime\.js(?:\?|["']))/i.test(html)) {
    const prefix = page.path.includes('/') ? '../' : '';
    html = html.replace(/<\/body>/i, `  <script src="${prefix}site-runtime.js" defer></script>\n</body>`);
  }
  if (page.path === 'exoplanet-pioneer.html' && !/(?:src=["']ita-universe-shell\.js(?:\?|["']))/i.test(html)) {
    html = html.replace(/<\/body>/i, '  <script src="ita-universe-shell.js" defer data-ita-universe-shell></script>\n</body>');
  }
  await fs.writeFile(file, html, 'utf8');
}

await Promise.all(SITE_PAGES.map(transformPage));

const experimentalPages = [
  ['experimental/webgpu-galaxy/galaxy-sim.html', 'Browser-local WebGPU compute; no application backend.'],
  ['experimental/webgpu-galaxy/nebula-sim.html', 'Browser-local WebGPU nebula renderer; no application backend.'],
  ['experimental/procedural-planets/index.html', 'Browser-local WebGL scene with versioned external Three.js modules.'],
  ['experimental/fluid-nebula/index.html', 'Browser-local Canvas 2D particle simulation; no application backend.'],
  ['experimental/sentient-browser/hal-interface.html', 'WebGPU or network-assisted AI experiment; remote inference is operated separately from this website release.'],
  ['experimental/holographic-xr/surface-explorer.html', 'Device-specific WebXR experiment with external Three.js modules.'],
  ['experimental/holographic-xr/ar-star-chart.html', 'Device-specific immersive-AR experiment with external Three.js modules.'],
  ['experimental/connected-cosmos/cosmic-radio.html', 'Same-origin tab communication simulation; no public radio backend.'],
  ['experimental/connected-cosmos/p2p-network.html', 'Same-origin tab data-mesh simulation; no internet-wide peer backend.'],
  ['experimental/native-integration/captains-log.html', 'Permission-based local File System Access experiment.'],
  ['experimental/native-integration/telemetry.html', 'Permission-based WebSerial experiment with a browser-only simulation fallback.']
];
await Promise.all(experimentalPages.map(async ([relativePath, disclosure]) => {
  const file = path.join(publicRoot, ...relativePath.split('/'));
  let html = await fs.readFile(file, 'utf8');
  html = html.replace(legacyMegaEnginePattern, '');
  html = removeHeadTag(html, /\s*<meta\b[^>]*name=["'](?:robots|googlebot)["'][^>]*>/gi);
  html = removeHeadTag(html, /\s*<link\b[^>]*rel=["']canonical["'][^>]*>/gi);
  html = removeHeadTag(html, /\s*<meta\b[^>]*(?:property=["']og:(?:url|site_name|image|image:alt)["']|name=["']twitter:(?:card|image|image:alt)["'])[^>]*>/gi);
  const canonical = `${SITE_ORIGIN}/${relativePath}`;
  const labMetadata = `<meta name="robots" content="noindex,follow,max-image-preview:large"><meta name="googlebot" content="noindex,follow"><link rel="canonical" href="${canonical}"><meta property="og:url" content="${canonical}"><meta property="og:site_name" content="Adriano To The Star"><meta property="og:image" content="${SITE_ORIGIN}/images/bg-large.jpg"><meta property="og:image:alt" content="Adriano To The Star experimental browser lab"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="${SITE_ORIGIN}/images/bg-large.jpg"><meta name="twitter:image:alt" content="Adriano To The Star experimental browser lab">`;
  html = html.replace(/<\/head>/i, `  ${labMetadata}\n</head>`);
  if (!html.includes('experimental-lab.css')) html = html.replace(/<\/head>/i, '  <link rel="stylesheet" href="../../experimental-lab.css">\n</head>');
  html = html.replace(/\s*<details\b[^>]*class=["'][^"']*\bita-lab-disclosure\b[^"']*["'][^>]*>[\s\S]*?<\/details>/gi, '');
  const notice = `<details class="ita-lab-disclosure"><summary>Lab status</summary><div><strong>Experimental browser system</strong><p>${escapeHtml(disclosure)}</p><a href="../../projects.html">Return to the project catalog</a></div></details>`;
  html = html.replace(/<body\b[^>]*>/i, match => `${match}\n${notice}`);
  await fs.writeFile(file, html, 'utf8');
}));

await Promise.all(FLIGHT_EXEMPT_PAGES.map(async ({ path: relativePath, reason }) => {
  const file = path.join(publicRoot, ...relativePath.split('/'));
  let html = await fs.readFile(file, 'utf8');
  html = removeHeadTag(html, /\s*<meta\b[^>]*name=["']ita-flight-exempt["'][^>]*>/gi);
  html = html.replace(/<\/head>/i, `  <meta name="ita-flight-exempt" content="${escapeHtml(reason)}">\n</head>`);
  await fs.writeFile(file, html, 'utf8');
}));

const lastmod = releaseDate();
const sitemapPages = SITE_PAGES.filter(page => page.indexable);
function gitLastModified(page) {
  const candidates = [page.path, 'scripts/site-pages.mjs', 'scripts/prepare-production-pages.mjs'];
  try {
    const commitDate = execFileSync('git', ['log', '-1', '--format=%cI', '--', ...candidates], { encoding: 'utf8' }).trim();
    if (commitDate) return new Date(commitDate).toISOString().slice(0, 10);
  } catch {}
  return lastmod;
}

const sitemapEntries = sitemapPages.map(page => ({ page, lastmod: gitLastModified(page) }));
const sitemapLastmod = sitemapEntries.map(entry => entry.lastmod).sort().at(-1) || lastmod;
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapEntries.map(({ page, lastmod: pageLastmod }) => `  <url>\n    <loc>${canonicalUrl(page)}</loc>\n    <lastmod>${pageLastmod}</lastmod>\n  </url>`).join('\n')}\n</urlset>\n`;
const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <sitemap>\n    <loc>${SITE_ORIGIN}/sitemap.xml</loc>\n    <lastmod>${sitemapLastmod}</lastmod>\n  </sitemap>\n</sitemapindex>\n`;
await fs.writeFile(path.join(publicRoot, 'sitemap.xml'), sitemap, 'utf8');
await fs.writeFile(path.join(publicRoot, 'sitemap_index.xml'), sitemapIndex, 'utf8');

console.log(`Prepared ${SITE_PAGES.length} public pages, ${experimentalPages.length} bounded project labs, ${FLIGHT_EXEMPT_PAGES.length} explicit flight-rendering exemptions, and ${sitemapPages.length} indexable sitemap URLs for ${lastmod}.`);
