import { test, expect } from '@playwright/test';
import fs from 'fs';

const BASE_URL = process.env.BASE_URL || 'http://localhost:8095';
const ORIGIN = new URL(BASE_URL).origin;

const PAGES = [
    { name: 'home', path: '/index.html' },
    { name: 'database', path: '/database.html' },
    { name: 'stellar-ai', path: '/stellar-ai.html' },
    { name: 'games', path: '/games.html' },
    { name: 'marketplace', path: '/marketplace.html' },
    { name: 'analytics-dashboard', path: '/analytics-dashboard.html' },
    { name: 'secure-chat', path: '/secure-chat.html' },
    { name: 'education', path: '/education.html' },
    { name: 'projects', path: '/projects.html' },
    { name: 'offline', path: '/offline.html' }
];

function isSameOrigin(urlString) {
    try {
        return new URL(urlString).origin === ORIGIN;
    } catch {
        return false;
    }
}

function slugForPath(path) {
    return path.replace(/[^a-z0-9]+/gi, '-').replace(/(^-+|-+$)/g, '').toLowerCase();
}

test.describe('Smoke Tour - Key Pages', () => {
    test('visits key pages without uncaught errors or same-origin 4xx/5xx', async ({ page, request }, testInfo) => {
        test.setTimeout(5 * 60 * 1000);
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

        const context = page.context();

        for (const entry of PAGES) {
            const url = new URL(entry.path, BASE_URL).toString();
            const visitPage = await context.newPage();
            const logs = {
                console: [],
                pageErrors: [],
                requestFailures: [],
                badResponses: [],
                allBadResponses: [],
                undefinedDiagnostics: null
            };

            const onConsole = (msg) => {
                logs.console.push({ type: msg.type(), text: msg.text() });
            };

            const onPageError = (exception) => {
                logs.pageErrors.push({
                    message: exception && exception.message ? String(exception.message) : String(exception),
                    stack: exception && exception.stack ? String(exception.stack) : null
                });
            };

            const onRequestFailed = (req) => {
                const failure = req.failure();
                const reqUrl = req.url();

                if (!isSameOrigin(reqUrl)) return;

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
                    const req = res.request();
                    const sameOrigin = isSameOrigin(resUrl);
                    logs.allBadResponses.push({
                        url: resUrl,
                        status,
                        sameOrigin,
                        method: req.method(),
                        resourceType: req.resourceType()
                    });

                    if (!sameOrigin) return;

                    logs.badResponses.push({ url: resUrl, status });
                } catch {
                    // ignore
                }
            };

            visitPage.on('console', onConsole);
            visitPage.on('pageerror', onPageError);
            visitPage.on('requestfailed', onRequestFailed);
            visitPage.on('response', onResponse);

            await visitPage.goto(url, { waitUntil: 'load', timeout: 60000 });
            await visitPage.waitForTimeout(1500);
            await visitPage.waitForLoadState('networkidle', { timeout: 2000 }).catch(() => {});

            logs.undefinedDiagnostics = await visitPage.evaluate(() => {
                const isUndefinedValue = (value) => {
                    if (typeof value !== 'string') return false;
                    const v = value.trim();
                    if (!v) return false;
                    if (v === 'undefined') return true;
                    if (/url\(\s*['"]?undefined['"]?\s*\)/i.test(v)) return true;
                    return /\/undefined([?#]|$)/.test(v);
                };

                const resources = [];
                try {
                    const entries = (performance && performance.getEntriesByType)
                        ? performance.getEntriesByType('resource')
                        : [];

                    for (const entry of entries) {
                        const name = String(entry && entry.name ? entry.name : '');
                        if (!name) continue;
                        if (!/\/undefined([?#]|$)/.test(name)) continue;
                        resources.push({
                            name,
                            initiatorType: entry.initiatorType || null
                        });
                    }
                } catch (e) {
                }

                const elements = [];
                try {
                    const imgs = Array.from(document.querySelectorAll('img'));
                    for (const img of imgs) {
                        const srcAttr = img.getAttribute('src');
                        const dataSrc = img.getAttribute('data-src');
                        const src = img.src;
                        const currentSrc = img.currentSrc;
                        if (
                            isUndefinedValue(srcAttr || '') ||
                            isUndefinedValue(dataSrc || '') ||
                            isUndefinedValue(src || '') ||
                            isUndefinedValue(currentSrc || '')
                        ) {
                            elements.push({
                                tag: 'img',
                                id: img.id || null,
                                className: img.className || null,
                                srcAttr: srcAttr || null,
                                dataSrc: dataSrc || null,
                                src: src || null,
                                currentSrc: currentSrc || null,
                                outerHTML: (img.outerHTML || '').slice(0, 300)
                            });
                        }
                    }

                    const links = Array.from(document.querySelectorAll('link'));
                    for (const link of links) {
                        const rel = link.getAttribute('rel');
                        const hrefAttr = link.getAttribute('href');
                        const href = link.href;
                        if (isUndefinedValue(hrefAttr || '') || isUndefinedValue(href || '')) {
                            elements.push({
                                tag: 'link',
                                rel: rel || null,
                                hrefAttr: hrefAttr || null,
                                href: href || null,
                                outerHTML: (link.outerHTML || '').slice(0, 300)
                            });
                        }
                    }
                } catch (e) {
                }

                const styleAttributes = [];
                try {
                    const styledNodes = Array.from(document.querySelectorAll('[style]'));
                    for (const node of styledNodes) {
                        if (styleAttributes.length >= 25) break;
                        const styleAttr = node.getAttribute('style');
                        if (!isUndefinedValue(styleAttr || '')) continue;
                        styleAttributes.push({
                            tag: String(node.tagName || '').toLowerCase(),
                            id: node.id || null,
                            className: node.className || null,
                            styleAttr: styleAttr || null,
                            outerHTML: (node.outerHTML || '').slice(0, 300)
                        });
                    }
                } catch (e) {
                }

                const computedStyles = [];
                try {
                    const propsToCheck = [
                        'background-image',
                        'border-image-source',
                        'list-style-image',
                        'cursor',
                        'mask-image',
                        '-webkit-mask-image'
                    ];

                    const nodes = Array.from(document.querySelectorAll('*'));
                    for (const node of nodes) {
                        if (computedStyles.length >= 25) break;
                        const cs = getComputedStyle(node);
                        const hits = {};
                        for (const prop of propsToCheck) {
                            const val = cs.getPropertyValue(prop);
                            if (isUndefinedValue(val || '')) {
                                hits[prop] = (val || '').trim();
                            }
                        }
                        if (Object.keys(hits).length === 0) continue;

                        computedStyles.push({
                            tag: String(node.tagName || '').toLowerCase(),
                            id: node.id || null,
                            className: node.className || null,
                            styles: hits,
                            outerHTML: (node.outerHTML || '').slice(0, 300)
                        });
                    }
                } catch (e) {
                }

                const cssRules = [];
                try {
                    const sheets = Array.from(document.styleSheets || []);
                    for (const sheet of sheets) {
                        if (cssRules.length >= 25) break;
                        let rules;
                        try {
                            rules = sheet.cssRules;
                        } catch (e) {
                            continue;
                        }

                        for (const rule of Array.from(rules || [])) {
                            if (cssRules.length >= 25) break;
                            const text = String(rule && rule.cssText ? rule.cssText : '');
                            if (!isUndefinedValue(text)) continue;
                            cssRules.push({
                                sheetHref: sheet.href || null,
                                ruleText: text.slice(0, 400)
                            });
                        }
                    }
                } catch (e) {
                }

                return {
                    resources: resources.slice(0, 25),
                    elements: elements.slice(0, 25),
                    styleAttributes: styleAttributes.slice(0, 25),
                    computedStyles: computedStyles.slice(0, 25),
                    cssRules: cssRules.slice(0, 25)
                };
            });

            const pwa = await visitPage.evaluate(async () => {
                try {
                    if (!('serviceWorker' in navigator)) {
                        return { supported: false, hasRegistration: false };
                    }

                    const registration = await navigator.serviceWorker.getRegistration();
                    const scriptUrl = registration?.active?.scriptURL || registration?.installing?.scriptURL || registration?.waiting?.scriptURL || null;

                    return {
                        supported: true,
                        hasRegistration: Boolean(registration),
                        scope: registration?.scope || null,
                        scriptUrl
                    };
                } catch (e) {
                    return { supported: 'unknown', error: String(e) };
                }
            });

            const screenshotPath = testInfo.outputPath(`${entry.name}-${slugForPath(entry.path)}.png`);
            await visitPage.screenshot({ path: screenshotPath, fullPage: true });

            visitPage.off('console', onConsole);
            visitPage.off('pageerror', onPageError);
            visitPage.off('requestfailed', onRequestFailed);
            visitPage.off('response', onResponse);

            await visitPage.close();

            tourResults.push({ page: entry.name, url, logs, pwa });
        }

        await testInfo.attach('critical-endpoints.json', {
            body: JSON.stringify(endpointResults, null, 2),
            contentType: 'application/json'
        });

        await testInfo.attach('smoke-tour.json', {
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
                if (msg.type !== 'error') continue;
                problems.push({ type: 'console-error', page: result.page, url: result.url, message: msg.text });
            }
        }

        fs.writeFileSync(testInfo.outputPath('critical-endpoints.json'), JSON.stringify(endpointResults, null, 2));
        fs.writeFileSync(testInfo.outputPath('smoke-tour.json'), JSON.stringify(tourResults, null, 2));
        fs.writeFileSync(testInfo.outputPath('problems.json'), JSON.stringify(problems, null, 2));

        expect(problems, JSON.stringify(problems, null, 2)).toEqual([]);
    });
});
