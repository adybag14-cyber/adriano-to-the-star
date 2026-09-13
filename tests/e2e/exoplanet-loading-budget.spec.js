import { test, expect } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

test('cold sparse evidence meets the declared 20 Mbps / 80 ms network budget', async ({
    browser,
}, testInfo) => {
    test.setTimeout(120000);
    const samples = [];
    for (let i = 0; i < 10; i++) {
        const context = await browser.newContext();
        const page = await context.newPage();
        const cdp = await context.newCDPSession(page);
        await cdp.send('Network.enable');
        await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
        await cdp.send('Network.emulateNetworkConditions', {
            offline: false,
            latency: 80,
            downloadThroughput: 2500000,
            uploadThroughput: 2500000,
            connectionType: 'cellular4g',
        });
        const inappropriate = [];
        page.on('request', (r) => {
            if (/three\.webgpu|terrain-worker|\/renderer\.js/.test(r.url()))
                inappropriate.push(r.url());
        });
        const start = Date.now();
        await page.goto(`${testInfo.project.use.baseURL}/database.html?engine=K00129.02`, {
            waitUntil: 'domcontentloaded',
        });
        await expect(page.locator('#engine-mode')).toContainText('Appearance unknown');
        await expect(
            page.locator('#engine-panel-evidence').getByRole('link', {
                name: 'Kepler Objects of Interest — Cumulative Table',
                exact: true,
            })
        ).toBeVisible();
        samples.push(Date.now() - start);
        expect(inappropriate).toEqual([]);
        await context.close();
    }
    const sorted = [...samples].sort((a, b) => a - b);
    const p95 = sorted[Math.ceil(sorted.length * 0.95) - 1];
    const evidence = JSON.stringify(
        {
            samplesMs: samples,
            p95,
            network: '20 Mbps / 80 ms',
            coldContexts: true,
        },
        null,
        2
    );
    await writeFile(testInfo.outputPath('cold-evidence-timing.json'), evidence);
    await testInfo.attach('cold-evidence-timing', {
        body: evidence,
        contentType: 'application/json',
    });
    expect(p95).toBeLessThanOrEqual(3000);
});
