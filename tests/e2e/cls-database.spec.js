import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const CLS_BUDGET = Number(process.env.CLS_BUDGET || 0.1);

 function round5(value) {
     return Math.round(value * 100000) / 100000;
 }

 function computeSessionCLS(entries) {
     let maxValue = 0;
     let maxEntries = [];

     let sessionValue = 0;
     let sessionEntries = [];
     let sessionStartTime = 0;
     let lastEntryTime = 0;

     for (const entry of entries) {
         const startTime = typeof entry.startTime === 'number' ? entry.startTime : 0;
         const value = typeof entry.value === 'number' ? entry.value : 0;

         const withinSession =
             sessionEntries.length > 0 &&
             startTime - lastEntryTime < 1000 &&
             startTime - sessionStartTime < 5000;

         if (withinSession) {
             sessionValue += value;
             sessionEntries.push(entry);
             lastEntryTime = startTime;
         } else {
             sessionValue = value;
             sessionEntries = [entry];
             sessionStartTime = startTime;
             lastEntryTime = startTime;
         }

         if (sessionValue > maxValue) {
             maxValue = sessionValue;
             maxEntries = sessionEntries.slice();
         }
     }

     return { value: maxValue, entries: maxEntries };
 }

const targets = [
    { name: 'root-database', path: '/database.html' },
    { name: 'public-database', path: '/public/database.html' }
];

test('CLS budget - database pages', async ({ browser }, testInfo) => {
    test.setTimeout(3 * 60 * 1000);

    const context = await browser.newContext();
    const results = [];

    for (const target of targets) {
        const url = new URL(target.path, BASE_URL).toString();
        const page = await context.newPage();

        await page.bringToFront().catch(() => {});

        await page.addInitScript(() => {
            const describeNode = (node) => {
                try {
                    if (!node) return null;
                    const tag = node.tagName ? String(node.tagName).toUpperCase() : 'NODE';
                    const id = node.id ? `#${node.id}` : '';
                    const classList = node.classList ? Array.from(node.classList).filter(Boolean).slice(0, 3) : [];
                    const classes = classList.length ? `.${classList.join('.')}` : '';
                    return `${tag}${id}${classes}`;
                } catch {
                    return null;
                }
            };

            window.__cls = { value: 0, entries: [] };

            try {
                const observer = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    for (const entry of entries) {
                        if (!entry || entry.hadRecentInput) continue;
                        const sources = Array.isArray(entry.sources) ? entry.sources : [];
                        window.__cls.value += entry.value || 0;
                        window.__cls.entries.push({
                            value: entry.value || 0,
                            startTime: entry.startTime || 0,
                            sources: sources.map((source) => ({
                                node: describeNode(source && source.node ? source.node : null),
                                previousRect: source && source.previousRect ? source.previousRect : null,
                                currentRect: source && source.currentRect ? source.currentRect : null
                            }))
                        });
                    }
                });
                observer.observe({ type: 'layout-shift', buffered: true });
                window.__clsObserver = observer;
            } catch (e) {
                window.__clsError = String(e);
            }
        });

        let gotoError = null;
        try {
            await page.goto(url, { waitUntil: 'load', timeout: 60000 });
            await page.bringToFront().catch(() => {});
            await page.waitForTimeout(1000);
            await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
            await page.waitForTimeout(4000);
            await page.waitForFunction(() => Boolean(document.querySelector('.planet-card')), { timeout: 15000 }).catch(() => {});
            await page.waitForTimeout(1500);
        } catch (e) {
            gotoError = String(e);
        }

        const clsData = await page
            .evaluate(() => {
                const data = window.__cls;
                return {
                    visibilityState: document.visibilityState,
                    hidden: document.hidden,
                    error: window.__clsError || null,
                    value: data && typeof data.value === 'number' ? data.value : null,
                    entries: data && Array.isArray(data.entries) ? data.entries.slice(0, 1000) : []
                };
            })
            .catch((e) => ({
                visibilityState: null,
                hidden: null,
                error: `evaluate_failed: ${String(e)}`,
                value: null,
                entries: []
            }));

        const allEntries = (clsData.entries || [])
            .filter((entry) => entry && typeof entry.value === 'number' && !Number.isNaN(entry.value))
            .slice()
            .sort((a, b) => (a.startTime || 0) - (b.startTime || 0));

        const clsSum = allEntries.reduce((sum, entry) => sum + (entry.value || 0), 0);
        const maxEntry = allEntries.reduce((currentMax, entry) => {
            if (!currentMax) return entry;
            return (entry.value || 0) > (currentMax.value || 0) ? entry : currentMax;
        }, null);
        const maxEntryValue = maxEntry ? (maxEntry.value || 0) : 0;
        const maxEntrySources = maxEntry && Array.isArray(maxEntry.sources)
            ? maxEntry.sources.slice(0, 10).map((s) => (s && s.node ? s.node : 'UNKNOWN'))
            : [];

        const session = computeSessionCLS(allEntries);
        const sessionEntries = Array.isArray(session.entries) ? session.entries : [];
        const sessionCls = typeof session.value === 'number' ? session.value : 0;

        const perNodeSession = new Map();
        for (const entry of sessionEntries) {
            const v = typeof entry.value === 'number' ? entry.value : 0;
            const sources = Array.isArray(entry.sources) ? entry.sources : [];
            for (const source of sources) {
                const key = source && source.node ? source.node : 'UNKNOWN';
                perNodeSession.set(key, (perNodeSession.get(key) || 0) + v);
            }
        }

        const sessionTopNodes = Array.from(perNodeSession.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([node, value]) => ({ node, value }));

        const topEntries = allEntries
            .slice()
            .sort((a, b) => (b.value || 0) - (a.value || 0))
            .slice(0, 10);

        const result = {
            page: target.name,
            url,
            gotoError,
            visibilityState: clsData.visibilityState,
            hidden: clsData.hidden,
            clsSum,
            clsSumRounded: round5(clsSum),
            sessionCls,
            sessionClsRounded: round5(sessionCls),
            maxEntryValue,
            maxEntryValueRounded: round5(maxEntryValue),
            maxEntrySources,
            sessionTopNodes,
            topEntries
        };

        results.push(result);
        await page.close().catch(() => {});
    }

    await context.close().catch(() => {});

    await testInfo.attach('cls-database.json', {
        body: JSON.stringify({ budget: CLS_BUDGET, results }, null, 2),
        contentType: 'application/json'
    });

    for (const r of results) {
        console.log(`[CLS] ${r.page} ${r.url}`);
        console.log(`  visibilityState=${r.visibilityState} hidden=${r.hidden}`);
        console.log(`  clsSum=${r.clsSumRounded} sessionCls=${r.sessionClsRounded} maxEntry=${r.maxEntryValueRounded}`);
        if (r.gotoError) console.log(`  gotoError=${r.gotoError}`);
        const top = (r.sessionTopNodes || [])
            .slice(0, 5)
            .map((x) => `${x.node}:${round5(x.value)}`)
            .join(' | ');
        if (top) console.log(`  sessionTopNodes=${top}`);
        if (Array.isArray(r.maxEntrySources) && r.maxEntrySources.length) {
            console.log(`  maxEntrySources=${r.maxEntrySources.slice(0, 5).join(' | ')}`);
        }
    }

    for (const r of results) {
        expect.soft(r.gotoError, `${r.page} navigation error`).toBeNull();
        expect.soft(r.visibilityState, `${r.page} visibilityState`).toBe('visible');
        expect.soft(r.hidden, `${r.page} document.hidden`).toBe(false);
        expect.soft(typeof r.sessionCls === 'number', `${r.page} sessionCls is number`).toBe(true);
        expect.soft(r.sessionCls, `${r.page} sessionCls <= ${CLS_BUDGET}`).toBeLessThanOrEqual(CLS_BUDGET);
        expect.soft(typeof r.maxEntryValue === 'number', `${r.page} maxEntry is number`).toBe(true);
        expect.soft(r.maxEntryValue, `${r.page} maxEntry <= ${CLS_BUDGET}`).toBeLessThanOrEqual(CLS_BUDGET);
    }
});
