import { test, expect } from '@playwright/test';
import fs from 'fs';

const BASE_URL = process.env.BASE_URL || 'http://localhost:8095';
const ORIGIN = new URL(BASE_URL).origin;
const TAKE_SCREENSHOTS = /^(1|true|yes)$/i.test(String(process.env.SMOKE_SCREENSHOTS || ''));
const FAIL_ON_WARN = /^(1|true|yes)$/i.test(String(process.env.SMOKE_FAIL_ON_WARN || ''));

const PAGES = [
    { name: 'root-database', path: '/database.html', kind: 'database' },
    { name: 'public-database', path: '/public/database.html', kind: 'database' },
    { name: 'root-dashboard', path: '/dashboard.html', kind: 'dashboard' },
    { name: 'public-dashboard', path: '/public/dashboard.html', kind: 'dashboard' },
    { name: 'root-stellar-ai', path: '/stellar-ai.html', kind: 'stellar-ai' },
    { name: 'public-stellar-ai', path: '/public/stellar-ai.html', kind: 'stellar-ai' },
    { name: 'root-forum', path: '/forum.html', kind: 'forum' },
    { name: 'public-forum', path: '/public/forum.html', kind: 'forum' }
];

function writeProgress(testInfo, data) {
    try {
        const payload = Object.assign({ ts: new Date().toISOString() }, data || {});
        fs.writeFileSync(testInfo.outputPath('progress.json'), JSON.stringify(payload, null, 2));
    } catch {
    }
}

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

async function newPageWithTimeout(context, timeoutMs) {
    let timeoutHandle;
    const timeoutPromise = new Promise((_, reject) => {
        timeoutHandle = setTimeout(() => {
            reject(new Error(`Timed out after ${timeoutMs}ms waiting for context.newPage()`));
        }, timeoutMs);
    });

    try {
        return await Promise.race([context.newPage(), timeoutPromise]);
    } finally {
        if (timeoutHandle) {
            clearTimeout(timeoutHandle);
        }
    }
}

async function dispatchClick(page, selector) {
    return page.evaluate((sel) => {
        const el = document.querySelector(sel);
        if (!el) return false;
        el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
        return true;
    }, selector);
}

async function safeClick(page, selector) {
    try {
        await page.click(selector, { timeout: 5000 });
        return true;
    } catch {
    }

    try {
        await page.click(selector, { timeout: 5000, force: true });
        return true;
    } catch {
    }

    return dispatchClick(page, selector);
}

async function verifyLanguageSwitch(page, kind) {
    await page.waitForSelector('#lang-toggle-btn', { timeout: 30000 });

    const before = await page
        .locator('.lang-code')
        .first()
        .textContent()
        .then((value) => (value ? value.trim().toLowerCase() : null))
        .catch(() => null);

    const targetLang = before === 'es' ? 'fr' : 'es';
    const targetLabel = targetLang.toUpperCase();

    const databaseTitleSelector = '[data-i18n="database.title"]';
    const databaseSubtitleSelector = '[data-i18n="database.subtitle"]';

    const titleBefore =
        kind === 'database'
            ? await page
                  .waitForSelector(databaseTitleSelector, { timeout: 15000 })
                  .then(() =>
                      page
                          .locator(databaseTitleSelector)
                          .first()
                          .textContent()
                          .then((value) => (value ? value.trim() : null))
                  )
                  .catch(() => null)
            : null;

    const subtitleBefore =
        kind === 'database'
            ? await page
                  .waitForSelector(databaseSubtitleSelector, { timeout: 15000 })
                  .then(() =>
                      page
                          .locator(databaseSubtitleSelector)
                          .first()
                          .textContent()
                          .then((value) => (value ? value.trim() : null))
                  )
                  .catch(() => null)
            : null;

    await safeClick(page, '#lang-toggle-btn');
    await safeClick(page, `.lang-option[data-lang="${targetLang}"]`);

    await page.waitForFunction(
        (expected) => {
            const el = document.querySelector('.lang-code');
            return el && String(el.textContent || '').trim().toUpperCase() === expected;
        },
        targetLabel,
        { timeout: 15000 }
    );

    await page.waitForFunction(
        (expected) => localStorage.getItem('language-preference') === expected,
        targetLang,
        { timeout: 15000 }
    );

    let databaseTitleChanged = null;
    let databaseSubtitleChanged = null;
    if (kind === 'database') {
        const expectedTitle = await page.evaluate(
            (key) => (typeof window.t === 'function' ? window.t(key) : null),
            'database.title'
        );

        if (!expectedTitle || String(expectedTitle).trim() === 'database.title') {
            throw new Error(`Expected translated value for database.title after switching to ${targetLang}, but got ${String(expectedTitle)}`);
        }

        await page.waitForFunction(
            ({ sel, expected }) => {
                const el = document.querySelector(sel);
                if (!el) return false;
                return String(el.textContent || '').trim() === String(expected || '').trim();
            },
            { sel: databaseTitleSelector, expected: expectedTitle },
            { timeout: 20000 }
        );

        const titleAfter = await page
            .locator(databaseTitleSelector)
            .first()
            .textContent()
            .then((value) => (value ? value.trim() : null))
            .catch(() => null);

        if (!titleAfter) {
            throw new Error('database.title element text was missing after language switch');
        }

        if (titleBefore) {
            databaseTitleChanged = titleBefore !== titleAfter;
            if (!databaseTitleChanged) {
                throw new Error(`database.title did not change after switching to ${targetLang}`);
            }
        }

        const expectedSubtitle = await page.evaluate(
            (key) => (typeof window.t === 'function' ? window.t(key) : null),
            'database.subtitle'
        );

        if (!expectedSubtitle || String(expectedSubtitle).trim() === 'database.subtitle') {
            throw new Error(`Expected translated value for database.subtitle after switching to ${targetLang}, but got ${String(expectedSubtitle)}`);
        }

        await page.waitForFunction(
            ({ sel, expected }) => {
                const el = document.querySelector(sel);
                if (!el) return false;
                return String(el.textContent || '').trim() === String(expected || '').trim();
            },
            { sel: databaseSubtitleSelector, expected: expectedSubtitle },
            { timeout: 20000 }
        );

        const subtitleAfter = await page
            .locator(databaseSubtitleSelector)
            .first()
            .textContent()
            .then((value) => (value ? value.trim() : null))
            .catch(() => null);

        if (!subtitleAfter) {
            throw new Error('database.subtitle element text was missing after language switch');
        }

        if (subtitleBefore) {
            databaseSubtitleChanged = subtitleBefore !== subtitleAfter;
            if (!databaseSubtitleChanged) {
                throw new Error(`database.subtitle did not change after switching to ${targetLang}`);
            }
        }
    }

    return {
        before,
        target: targetLang,
        langCode: targetLabel,
        databaseTitleChanged,
        databaseSubtitleChanged
    };
}

async function runDatabaseActions(page) {
    await page.waitForSelector('#planet-search', { state: 'visible', timeout: 60000 });
    await page.waitForSelector('#results-container', { timeout: 60000 }).catch(() => {});

    await page.waitForFunction(() => document.querySelectorAll('.planet-card').length > 0, { timeout: 60000 });

    await page.fill('#planet-search', 'zzzzzzzz');
    await page.waitForTimeout(900);

    await page.waitForFunction(() => {
        const el = document.getElementById('search-count');
        return el && /^0\s+result/i.test(String(el.textContent || '').trim());
    }, { timeout: 20000 });

    await page.waitForFunction(() => document.querySelectorAll('.planet-card').length === 0, { timeout: 20000 });

    await page.fill('#planet-search', '');
    await page.waitForTimeout(900);

    await page.waitForFunction(() => document.querySelectorAll('.planet-card').length > 0, { timeout: 30000 });

    const firstBefore = await page.evaluate(() => document.querySelector('.planet-card')?.getAttribute('data-kepid') || null);

    await page.waitForSelector('#next-page', { timeout: 20000 });

    const nextDisabled = await page.evaluate(() => {
        const btn = document.getElementById('next-page');
        return btn ? Boolean(btn.disabled) : true;
    });

    if (nextDisabled) {
        throw new Error('Next page button was disabled unexpectedly.');
    }

    await page.click('#next-page');

    await page.waitForFunction(() => {
        return Boolean(window.databaseInstance && typeof window.databaseInstance.currentPage === 'number' && window.databaseInstance.currentPage > 1);
    }, { timeout: 20000 });

    const firstAfter = await page.evaluate(() => document.querySelector('.planet-card')?.getAttribute('data-kepid') || null);

    if (firstBefore && firstAfter && firstBefore === firstAfter) {
        throw new Error('Pagination next did not change the first rendered planet card.');
    }

    await page.waitForSelector('#prev-page', { timeout: 20000 });
    await page.click('#prev-page');

    await page.waitForFunction(() => {
        return Boolean(window.databaseInstance && window.databaseInstance.currentPage === 1);
    }, { timeout: 20000 });
}

async function runDashboardActions(page) {
    await page.waitForTimeout(1200);

    const loginButton = page.locator('.cosmic-login-button');
    if (await loginButton.isVisible().catch(() => false)) {
        await loginButton.first().click({ timeout: 10000 }).catch(() => {});
    } else {
        await page.evaluate(() => {
            if (typeof window.showModal === 'function') {
                window.showModal('login-modal');
            }
        });
    }

    const modal = page.locator('#login-modal');
    const modalVisible = await modal.isVisible().catch(() => false);
    if (modalVisible) {
        const closeButton = modal.locator('.close-modal');
        if (await closeButton.count()) {
            await closeButton.first().click({ timeout: 5000 }).catch(() => {});
        }
    }
}

async function runStellarAIActions(page) {
    await page.waitForSelector('#message-input', { state: 'visible', timeout: 30000 });

    const modelSelector = page.locator('#model-selector');
    if (await modelSelector.count()) {
        await page.selectOption('#model-selector', 'fallback').catch(() => {});
    }

    await page.fill('#message-input', 'Hello from functional smoke test');
    await page.click('#send-btn').catch(() => {});

    await page.waitForTimeout(1200);

    const newChatButton = page.locator('#new-chat-btn');
    if (await newChatButton.count()) {
        await newChatButton.first().click({ timeout: 10000 }).catch(() => {});
    }
}

async function runForumActions(page) {
    const toggle = page.locator('#menu-toggle');
    if (await toggle.count()) {
        await toggle.first().click({ timeout: 10000 }).catch(() => {});
        await page.waitForTimeout(300);
        await page.keyboard.press('Escape').catch(() => {});
    }

    const category = page.locator('.forum-category');
    if (await category.count()) {
        await category.first().click({ timeout: 10000 }).catch(() => {});
    }

    const post = page.locator('.forum-post');
    if (await post.count()) {
        await post.first().click({ timeout: 10000 }).catch(() => {});
    }
}

async function runActions(kind, page) {
    if (kind === 'database') {
        await runDatabaseActions(page);
        return;
    }

    if (kind === 'dashboard') {
        await runDashboardActions(page);
        return;
    }

    if (kind === 'stellar-ai') {
        await runStellarAIActions(page);
        return;
    }

    if (kind === 'forum') {
        await runForumActions(page);
    }
}

test.describe('Functional Smoke - Core Pages', () => {
    test('interacts with root + public core pages without uncaught errors, unhandled rejections, or same-origin 4xx/5xx', async ({ page, request }, testInfo) => {
        test.setTimeout(25 * 60 * 1000);

        writeProgress(testInfo, { step: 'start', baseUrl: BASE_URL });

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

        const tourResults = [];

        await page.addInitScript(() => {
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

        for (const entry of PAGES) {
            const url = new URL(entry.path, BASE_URL);
            url.searchParams.set('cb', 'smoke-functional');

            console.log(`[smoke-functional] Visiting ${entry.name}: ${url.toString()}`);
            writeProgress(testInfo, { step: 'beforeVisit', page: entry.name, url: url.toString() });

            const visitPage = page;

            writeProgress(testInfo, { step: 'pageReady', page: entry.name });

            const logs = {
                consoleErrors: [],
                consoleWarnings: [],
                pageErrors: [],
                requestFailures: [],
                badResponses: [],
                gotoError: null,
                runtimeErrors: [],
                runtimeRejections: [],
                actionErrors: [],
                languageSwitch: null
            };

            const onConsole = (msg) => {
                const type = msg.type();
                if (type === 'error') {
                    logs.consoleErrors.push({ type, text: msg.text() });
                } else if (type === 'warning') {
                    logs.consoleWarnings.push({ type, text: msg.text() });
                }
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

            writeProgress(testInfo, { step: 'beforeGoto', page: entry.name, url: url.toString() });

            try {
                await visitPage.goto(url.toString(), { waitUntil: 'load', timeout: 60000 });
                await visitPage.waitForTimeout(800);
                await visitPage.waitForLoadState('networkidle', { timeout: 2500 }).catch(() => {});
            } catch (e) {
                logs.gotoError = String(e);
            }

            writeProgress(testInfo, { step: 'afterGoto', page: entry.name, gotoError: logs.gotoError });

            if (!logs.gotoError) {
                writeProgress(testInfo, { step: 'beforeLanguageSwitch', page: entry.name });
                try {
                    logs.languageSwitch = await verifyLanguageSwitch(visitPage, entry.kind);
                } catch (e) {
                    logs.actionErrors.push(`language-switch: ${String(e)}`);
                }

                writeProgress(testInfo, { step: 'afterLanguageSwitch', page: entry.name });

                writeProgress(testInfo, { step: 'beforeActions', page: entry.name, kind: entry.kind });
                try {
                    await runActions(entry.kind, visitPage);
                } catch (e) {
                    logs.actionErrors.push(String(e));
                }

                writeProgress(testInfo, { step: 'afterActions', page: entry.name, kind: entry.kind });

                logs.runtimeErrors = await visitPage
                    .evaluate(() => (Array.isArray(window.__smokeErrors) ? window.__smokeErrors.slice(0, 25) : []))
                    .catch((e) => [{ message: `evaluate_failed: ${String(e)}` }]);

                logs.runtimeRejections = await visitPage
                    .evaluate(() => (Array.isArray(window.__smokeUnhandledRejections) ? window.__smokeUnhandledRejections.slice(0, 25) : []))
                    .catch((e) => [{ message: `evaluate_failed: ${String(e)}`, stack: null }]);
            }

            const hasProblems =
                Boolean(logs.gotoError) ||
                logs.actionErrors.length > 0 ||
                logs.pageErrors.length > 0 ||
                logs.badResponses.length > 0 ||
                logs.requestFailures.length > 0 ||
                logs.consoleErrors.length > 0 ||
                logs.runtimeErrors.length > 0 ||
                logs.runtimeRejections.length > 0 ||
                (FAIL_ON_WARN && logs.consoleWarnings.length > 0);

            if (TAKE_SCREENSHOTS || hasProblems) {
                const screenshotName = `${entry.name}-${slugForPath(entry.path)}.png`;
                const fullPage = entry.kind !== 'database';
                await visitPage
                    .screenshot({ path: testInfo.outputPath(screenshotName), fullPage })
                    .catch(() => {});
            }

            writeProgress(testInfo, { step: 'afterScreenshot', page: entry.name, hasProblems });

            visitPage.off('console', onConsole);
            visitPage.off('pageerror', onPageError);
            visitPage.off('requestfailed', onRequestFailed);
            visitPage.off('response', onResponse);

            writeProgress(testInfo, { step: 'pageComplete', page: entry.name });

            tourResults.push({ page: entry.name, url: url.toString(), logs });
        }

        await testInfo.attach('critical-endpoints.json', {
            body: JSON.stringify(endpointResults, null, 2),
            contentType: 'application/json'
        });

        await testInfo.attach('smoke-functional.json', {
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

            for (const err of result.logs.actionErrors) {
                problems.push({ type: 'action-error', page: result.page, url: result.url, error: err });
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

            for (const msg of result.logs.consoleErrors) {
                problems.push({ type: 'console-error', page: result.page, url: result.url, message: msg.text });
            }

            if (FAIL_ON_WARN) {
                for (const msg of result.logs.consoleWarnings) {
                    problems.push({ type: 'console-warning', page: result.page, url: result.url, message: msg.text });
                }
            }

            for (const err of result.logs.runtimeErrors) {
                problems.push({ type: 'runtime-error', page: result.page, url: result.url, error: err });
            }

            for (const rej of result.logs.runtimeRejections) {
                problems.push({ type: 'unhandled-rejection', page: result.page, url: result.url, rejection: rej });
            }
        }

        fs.writeFileSync(testInfo.outputPath('critical-endpoints.json'), JSON.stringify(endpointResults, null, 2));
        fs.writeFileSync(testInfo.outputPath('smoke-functional.json'), JSON.stringify(tourResults, null, 2));
        fs.writeFileSync(testInfo.outputPath('problems.json'), JSON.stringify(problems, null, 2));

        expect(problems, JSON.stringify(problems, null, 2)).toEqual([]);
    });
});
