import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from '@playwright/test';
import { SITE_PAGES, FLIGHT_EXEMPT_PAGES } from './site-pages.mjs';

// This is an inventory, not a claim that every listed action was executed.
// Outcome-based interaction checks live in site-action-contracts.spec.js.
const origin = process.env.BASE_URL || 'http://127.0.0.1:8095';
const out = path.resolve(process.env.AUDIT_OUTPUT || '.artifacts/audit-20260904/baseline');
await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch({ headless: true, args: ['--enable-webgl', '--ignore-gpu-blocklist'] });
const targets = [...SITE_PAGES, ...FLIGHT_EXEMPT_PAGES];
const results = [];
const startedAt = new Date().toISOString();
const timeout = setTimeout(() => { console.error('Audit exceeded 15-minute limit.'); browser.close(); }, 900_000);
try {
  for (const entry of targets) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const slug = entry.path.replace(/[^a-z0-9]/gi, '-');
    const row = { path: entry.path, reason: entry.reason || 'governed-page', errors: [], failedRequests: [], badResponses: [], screenshots: [] };
    const unique = list => [...new Set(list)];
    page.on('pageerror', error => row.errors.push(error.message));
    page.on('requestfailed', request => row.failedRequests.push({ url: request.url(), error: request.failure()?.errorText }));
    page.on('response', response => { if (response.status() >= 400) row.badResponses.push({ url: response.url(), status: response.status() }); });
    // Do not enter separately operated subdomains or external account services.
    await context.route('**/*', route => {
      const req = route.request();
      const url = new URL(req.url());
      if (req.isNavigationRequest() && req.frame() === page.mainFrame() && url.origin !== new URL(origin).origin) {
        row.externalRedirect = url.href;
        return route.fulfill({ status: 200, contentType: 'text/html', body: '<h1>External destination recorded; service excluded from website audit.</h1>' });
      }
      return route.continue();
    });
    try {
      const response = await page.goto(`${origin}/${entry.path}`, { waitUntil: 'domcontentloaded', timeout: 25_000 });
      row.status = response?.status();
      await page.waitForTimeout(1700);
      for (const position of ['top', 'middle', 'bottom']) {
        await page.evaluate(position => {
          const range = Math.max(0, document.documentElement.scrollHeight - innerHeight);
          scrollTo(0, position === 'middle' ? range / 2 : position === 'bottom' ? range : 0);
        }, position);
        await page.waitForTimeout(100);
        const filename = `${slug}-${position}.jpg`;
        await page.screenshot({ path: path.join(out, filename), type: 'jpeg', quality: 65, timeout: 6000 });
        row.screenshots.push(filename);
      }
      Object.assign(row, await page.evaluate(() => {
        const visible = element => {
          const r = element.getBoundingClientRect();
          const s = getComputedStyle(element);
          return r.width > 0 && r.height > 0 && s.display !== 'none' && s.visibility !== 'hidden';
        };
        const controls = [...document.querySelectorAll('button,a[href],input,select,textarea,[role="button"],summary')].filter(visible).map((el, index) => ({
          index, tag: el.tagName.toLowerCase(), id: el.id, role: el.getAttribute('role'),
          label: (el.getAttribute('aria-label') || el.textContent || el.getAttribute('placeholder') || el.getAttribute('title') || '').trim().replace(/\s+/g, ' ').slice(0, 240),
          href: el.getAttribute('href'), disabled: el.disabled || el.getAttribute('aria-disabled') === 'true',
          type: el.getAttribute('type'), onclick: el.getAttribute('onclick'),
          outcome: el.disabled || el.getAttribute('aria-disabled') === 'true' ? 'explicitly-disabled' : el.tagName === 'A' ? 'navigation-inventory' : 'requires-outcome-test'
        }));
        return {
          title: document.title, url: location.href, controls,
          brokenImages: [...document.images].filter(img => img.complete && img.naturalWidth === 0).map(img => img.currentSrc || img.src),
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          deadAnchors: controls.filter(c => c.href?.startsWith('#') && c.href.length > 1 && !document.getElementById(decodeURIComponent(c.href.slice(1))))
        };
      }));
      row.errors = unique(row.errors);
    } catch (error) { row.auditError = error.message; }
    results.push(row);
    await fs.writeFile(path.join(out, 'inventory.json'), JSON.stringify({ startedAt, origin, results }, null, 2));
    console.log(`${results.length}/${targets.length} ${entry.path}: ${row.controls?.length ?? 0} controls, ${row.errors.length} errors`);
    await context.close();
  }
} finally { clearTimeout(timeout); await browser.close(); }
const summary = {
  pages: results.length,
  controls: results.reduce((sum, row) => sum + (row.controls?.length || 0), 0),
  pagesWithErrors: results.filter(row => row.errors.length || row.auditError).map(row => ({ path: row.path, errors: row.errors, auditError: row.auditError })),
  pagesWithBrokenImages: results.filter(row => row.brokenImages?.length).map(row => ({ path: row.path, images: row.brokenImages })),
  pagesWithOverflow: results.filter(row => row.overflow > 2).map(row => ({ path: row.path, overflow: row.overflow })),
  note: 'Visible controls were inventoried and page scrolling/screenshots exercised. This report does not assert every control final effect; see outcome tests and manual review.'
};
await fs.writeFile(path.join(out, 'summary.json'), JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));
