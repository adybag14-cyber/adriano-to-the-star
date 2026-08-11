import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:8095';
const ORIGIN = new URL(BASE_URL).origin;
const FULL_SMOKE = /^(1|true|yes)$/i.test(String(process.env.FULL_SMOKE || process.env.SMOKE_ALL_PAGES || ''));
const TAKE_SCREENSHOTS = /^(1|true|yes)$/i.test(String(process.env.SMOKE_SCREENSHOTS || ''));

function isSameOrigin(urlString) {
    try {
        return new URL(urlString).origin === ORIGIN;
    } catch {
        return false;
    }
}

function slugForPath(value) {
    return String(value || '')
        .replace(/[^a-z0-9]+/gi, '-')
        .replace(/(^-+|-+$)/g, '')
        .toLowerCase();
}

const IGNORED_CONSOLE_WARNING_PATTERNS = [
    /Web Vital Alert:/i,
    /Performance budget exceeded/i,
    /Consider code splitting/i,
    /Automatic fallback to software WebGL has been deprecated/i,
    /GL Driver Message/i,
    /GPU stall due to ReadPixels/i,
    /(webgl|cpu) backend was already registered\./i,
    /Platform browser has already been set\./i,
    /No Web3 wallet detected/i,
    /Failed to load live exoplanet data for AI predictions/i
];

function shouldIgnoreConsoleWarning(text) {
    const value = String(text || '');
    return IGNORED_CONSOLE_WARNING_PATTERNS.some((pattern) => pattern.test(value));
}

function shouldIgnoreConsoleError(pageName, text) {
    const page = String(pageName || '');
    const value = String(text || '');

    if (/log-test/i.test(page) && /net::ERR_CONNECTION_REFUSED/i.test(value)) return true;
    if (/test-backend-connection/i.test(page) && /net::ERR_(FAILED|CONNECTION_REFUSED)/i.test(value)) return true;
    if (/test-stellar-ai-page/i.test(page) && /net::ERR_(FAILED|CONNECTION_REFUSED)/i.test(value)) return true;
    if (/space-dashboard/i.test(page) && /Error fetching nasa_exoplanets/i.test(value)) return true;
    if (/index-scraped/i.test(page) && /the server responded with a status of (400|429)/i.test(value)) return true;

    return false;
}

function shouldIgnoreIndexScrapedIssue(pageName, text) {
    const page = String(pageName || '');
    const value = String(text || '');
    if (!/index-scraped/i.test(page)) return false;
    if (/Failed to construct 'Worker'/i.test(value)) return true;
    if (/platformWorkerPromise falied/i.test(value)) return true;
    if (/did not find the pageId/i.test(value)) return true;
    return false;
}

function shouldIgnoreRequestFailure(request) {
    const req = request || {};
    const errorText = String(req.errorText || '');
    if (!errorText.includes('net::ERR_ABORTED')) return false;
    if (String(req.method || '').toUpperCase() === 'HEAD') return true;

    const url = String(req.url || '');
    if (/\/cheerpj\//i.test(url)) return true;
    if (/\.(png|jpe?g|gif|webp|svg|mp3|wav|mp4|webm|glb)(\?|$)/i.test(url)) return true;

    return false;
}

function shouldIgnoreProblem(problem) {
    if (!problem || typeof problem !== 'object') return false;

    if (problem.type === 'console-warning') return shouldIgnoreConsoleWarning(problem.message);
    if (problem.type === 'console-error') return shouldIgnoreConsoleError(problem.page, problem.message);
    if (problem.type === 'pageerror') return shouldIgnoreIndexScrapedIssue(problem.page, problem.error);
    if (problem.type === 'runtime-error') return shouldIgnoreIndexScrapedIssue(problem.page, problem.error && problem.error.message);
    if (problem.type === 'unhandled-rejection') return shouldIgnoreIndexScrapedIssue(problem.page, problem.rejection && problem.rejection.message);
    if (problem.type === 'request-failed') return shouldIgnoreRequestFailure(problem.request);

    return false;
}

function listHtmlFiles(relativeDir) {
    const dirPath = relativeDir ? path.join(process.cwd(), relativeDir) : process.cwd();
    try {
        return fs
            .readdirSync(dirPath)
            .filter((entry) => {
                if (!entry || !entry.toLowerCase().endsWith('.html')) return false;
                try {
                    return fs.statSync(path.join(dirPath, entry)).isFile();
                } catch {
                    return false;
                }
            })
            .sort((a, b) => a.localeCompare(b));
    } catch {
        return [];
    }
}

function buildPages() {
    const rootFiles = listHtmlFiles('');
    const publicFiles = listHtmlFiles('public');

    const rootPages = rootFiles.map((file) => ({
        name: `root-${slugForPath(file)}`,
        path: `/${file}`
    }));

    const publicPages = publicFiles.map((file) => ({
        name: `public-${slugForPath(file)}`,
        path: `/public/${file}`
    }));

    return [...rootPages, ...publicPages];
}

async function dispatchClick(page, selector) {
    return page.evaluate((sel) => {
        const el = document.querySelector(sel);
        if (!el) return false;
        el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
        return true;
    }, selector);
}

async function getNavStatus(page) {
    return page.evaluate(() => {
        const navScript = Array.from(document.scripts || []).some((s) => String(s && s.src ? s.src : '').includes('navigation.js'));
        const toggle = document.getElementById('menu-toggle');
        const overlay = document.getElementById('menu-overlay');
        const toggleZ = toggle ? getComputedStyle(toggle).zIndex : null;
        const overlayZ = overlay ? getComputedStyle(overlay).zIndex : null;
        const overlayActive = overlay ? overlay.classList.contains('active') : null;
        return {
            navScript,
            hasToggle: Boolean(toggle),
            hasOverlay: Boolean(overlay),
            toggleZ,
            overlayZ,
            overlayActive
        };
    });
}

test.describe('Smoke Tour - All Pages', () => {
    test.skip(!FULL_SMOKE, 'Set FULL_SMOKE=1 (or SMOKE_ALL_PAGES=1) to run the full cross-page smoke test.');

    test('visits all HTML pages (root + public) without uncaught errors, unhandled rejections, or same-origin 4xx/5xx', async ({ page, request }, testInfo) => {
        test.setTimeout(30 * 60 * 1000);

        const pages = buildPages();
        const criticalEndpoints = [
            { name: 'manifest', path: '/manifest.json' },
            { name: 'service-worker', path: '/sw.js' },
            { name: 'offline-fallback', path: '/offline.html' }
        ];

        const endpointResults = [];
        for (const endpoint of criticalEndpoints) {
            const url = new URL(endpoint.path, BASE_URL).toString();
            const res = await request.get(url);
            endpointResults.push({ name: endpoint.name, url, status: res.status() });
        }

        const context = page.context();
        const tourResults = [];

        for (const entry of pages) {
            const url = new URL(entry.path, BASE_URL).toString();
            const visitPage = await context.newPage();

            await visitPage.bringToFront().catch(() => {});

            const logs = {
                console: [],
                pageErrors: [],
                requestFailures: [],
                badResponses: [],
                gotoError: null,
                runtimeErrors: [],
                runtimeRejections: [],
                nav: null
            };

            const onConsole = (msg) => {
                const type = msg.type();
                if (type !== 'error' && type !== 'warning') return;
                logs.console.push({ type, text: msg.text() });
            };

            const onPageError = (exception) => {
                logs.pageErrors.push(String(exception));
            };

            const onRequestFailed = (req) => {
                const reqUrl = req.url();
                if (!isSameOrigin(reqUrl)) return;

                const failure = req.failure();
                logs.requestFailures.push({
                    url: reqUrl,
                    method: req.method(),
                    resourceType: req.resourceType(),
                    errorText: failure ? failure.errorText : 'unknown'
                });
            };

            const onResponse = (res) => {
                try {
                    const status = res.status();
                    if (status < 400) return;

                    const resUrl = res.url();
                    if (!isSameOrigin(resUrl)) return;

                    logs.badResponses.push({ url: resUrl, status });
                } catch {
                }
            };

            visitPage.on('console', onConsole);
            visitPage.on('pageerror', onPageError);
            visitPage.on('requestfailed', onRequestFailed);
            visitPage.on('response', onResponse);

            await visitPage.addInitScript(() => {
                window.__smokeErrors = [];
                window.__smokeUnhandledRejections = [];

                window.addEventListener('error', (event) => {
                    window.__smokeErrors.push({
                        message: event && event.message ? event.message : null,
                        filename: event && event.filename ? event.filename : null,
                        lineno: event && typeof event.lineno === 'number' ? event.lineno : null,
                        colno: event && typeof event.colno === 'number' ? event.colno : null
                    });
                });

                window.addEventListener('unhandledrejection', (event) => {
                    const reason = event ? event.reason : null;
                    window.__smokeUnhandledRejections.push({
                        message: reason && reason.message ? reason.message : String(reason),
                        stack: reason && reason.stack ? reason.stack : null
                    });
                });
            });

            try {
                await visitPage.goto(url, { waitUntil: 'load', timeout: 60000 });
                await visitPage.bringToFront().catch(() => {});
                await visitPage.waitForTimeout(900);
                await visitPage.waitForLoadState('networkidle', { timeout: 2000 }).catch(() => {});
            } catch (e) {
                logs.gotoError = String(e);
            }

            if (!logs.gotoError) {
                logs.runtimeErrors = await visitPage
                    .evaluate(() => (Array.isArray(window.__smokeErrors) ? window.__smokeErrors.slice(0, 25) : []))
                    .catch((e) => [{ message: `evaluate_failed: ${String(e)}` }]);

                logs.runtimeRejections = await visitPage
                    .evaluate(() => (Array.isArray(window.__smokeUnhandledRejections) ? window.__smokeUnhandledRejections.slice(0, 25) : []))
                    .catch((e) => [{ message: `evaluate_failed: ${String(e)}`, stack: null }]);

                logs.nav = await getNavStatus(visitPage).catch((e) => ({ error: String(e) }));

                const shouldTestNav = logs.nav && logs.nav.navScript;
                if (shouldTestNav) {
                    if (!logs.nav.hasToggle || !logs.nav.hasOverlay) {
                        logs.nav.navTest = { ok: false, reason: 'navigation.js present but menu elements missing' };
                    } else {
                        const navTest = { ok: true, opened: false, closed: false };

                        await dispatchClick(visitPage, '#menu-toggle').catch(() => false);
                        const opened = await visitPage
                            .waitForFunction(() => {
                                const overlay = document.getElementById('menu-overlay');
                                return Boolean(overlay && overlay.classList.contains('active'));
                            }, { timeout: 2500 })
                            .then(() => true)
                            .catch(() => false);

                        navTest.opened = opened;

                        await visitPage.keyboard.press('Escape').catch(() => {});
                        const closed = await visitPage
                            .waitForFunction(() => {
                                const overlay = document.getElementById('menu-overlay');
                                return Boolean(overlay && !overlay.classList.contains('active'));
                            }, { timeout: 3500 })
                            .then(() => true)
                            .catch(() => false);

                        navTest.closed = closed;
                        navTest.ok = opened && closed;

                        logs.nav.navTest = navTest;
                    }
                }
            }

            const hasProblems =
                Boolean(logs.gotoError) ||
                logs.pageErrors.length > 0 ||
                logs.badResponses.length > 0 ||
                logs.requestFailures.length > 0 ||
                logs.console.length > 0 ||
                logs.runtimeErrors.length > 0 ||
                logs.runtimeRejections.length > 0 ||
                Boolean(logs.nav && logs.nav.navTest && logs.nav.navTest.ok === false);

            if (TAKE_SCREENSHOTS) {
                const screenshotName = `${entry.name}-${slugForPath(entry.path)}.png`;
                const screenshotPath = testInfo.outputPath(screenshotName);
                await visitPage.screenshot({ path: screenshotPath, fullPage: true }).catch(() => {});
            }

            visitPage.off('console', onConsole);
            visitPage.off('pageerror', onPageError);
            visitPage.off('requestfailed', onRequestFailed);
            visitPage.off('response', onResponse);

            await visitPage.close();

            tourResults.push({ page: entry.name, url, logs });
        }

        await testInfo.attach('critical-endpoints.json', {
            body: JSON.stringify(endpointResults, null, 2),
            contentType: 'application/json'
        });

        await testInfo.attach('smoke-all-pages.json', {
            body: JSON.stringify(tourResults, null, 2),
            contentType: 'application/json'
        });

        const problems = [];

        for (const endpoint of endpointResults) {
            if (endpoint.status >= 400) {
                problems.push({
                    type: 'critical-endpoint',
                    name: endpoint.name,
                    url: endpoint.url,
                    status: endpoint.status
                });
            }
        }

        for (const result of tourResults) {
            if (result.logs.gotoError) {
                problems.push({ type: 'goto-failed', page: result.page, url: result.url, error: result.logs.gotoError });
            }

            for (const err of result.logs.pageErrors) {
                problems.push({ type: 'pageerror', page: result.page, url: result.url, error: err });
            }

            for (const res of result.logs.badResponses) {
                problems.push({ type: 'bad-response', page: result.page, url: result.url, resourceUrl: res.url, status: res.status });
            }

            for (const req of result.logs.requestFailures) {
                problems.push({ type: 'request-failed', page: result.page, url: result.url, request: req });
            }

            for (const msg of result.logs.console) {
                problems.push({ type: `console-${msg.type}`, page: result.page, url: result.url, message: msg.text });
            }

            for (const err of result.logs.runtimeErrors) {
                problems.push({ type: 'runtime-error', page: result.page, url: result.url, error: err });
            }

            for (const rej of result.logs.runtimeRejections) {
                problems.push({ type: 'unhandled-rejection', page: result.page, url: result.url, rejection: rej });
            }

            if (result.logs.nav && result.logs.nav.navTest && result.logs.nav.navTest.ok === false) {
                problems.push({ type: 'navigation', page: result.page, url: result.url, nav: result.logs.nav });
            }
        }

        const filteredProblems = problems.filter((problem) => !shouldIgnoreProblem(problem));

        fs.writeFileSync(testInfo.outputPath('critical-endpoints.json'), JSON.stringify(endpointResults, null, 2));
        fs.writeFileSync(testInfo.outputPath('smoke-all-pages.json'), JSON.stringify(tourResults, null, 2));
        fs.writeFileSync(testInfo.outputPath('problems.raw.json'), JSON.stringify(problems, null, 2));
        fs.writeFileSync(testInfo.outputPath('problems.json'), JSON.stringify(filteredProblems, null, 2));

        expect(filteredProblems, JSON.stringify(filteredProblems, null, 2)).toEqual([]);
    });
});
